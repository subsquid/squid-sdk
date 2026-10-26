import * as http from 'http'
import {AddressInfo} from 'net'
import {afterEach, describe, expect, it} from 'vitest'
import {Rpc} from '../src/rpc'
import {EvmRpcClient} from '../src/rpc-client'
import {getChainId, loadBlock, loadDebugFrames} from './helpers/fixture-loader'


// Ethereum Sepolia block 11319411 as served by a provider that drops the payload
// of the selfdestruct frame in transaction 17.
const CHAIN = 'ethereum-sepolia'
const BLOCK = 11319411
const POISONED_TX = '0xf6c6e39b79667c78858e4c5b924a22d834427d7287e8a3b26219fe5dce180065'


interface Upstream {
    url: string
    traceRequests: () => number
    close: () => Promise<void>
}


/**
 * Serves the recorded block and call traces, and answers every opcode-tracer
 * request with an internal error, as a node that times out on it does.
 */
async function startUpstream(): Promise<Upstream> {
    let block = loadBlock(CHAIN, BLOCK)
    let frames = loadDebugFrames(CHAIN, BLOCK, 'malformed')
    let traceRequests = 0

    let answer = (req: any) => {
        switch (req.method) {
            case 'eth_chainId':
                return {result: getChainId(CHAIN)}
            case 'eth_getBlockByNumber':
                return {result: block}
            case 'debug_traceBlockByNumber':
                return {result: frames}
            case 'debug_traceTransaction':
                traceRequests += 1
                return {error: {code: -32000, message: 'execution timeout'}}
            default:
                return {error: {code: -32601, message: `method ${req.method} not found`}}
        }
    }

    let server = http.createServer((request, response) => {
        let body = ''
        request.on('data', chunk => body += chunk)
        request.on('end', () => {
            let payload = JSON.parse(body)
            let reply = Array.isArray(payload)
                ? payload.map(req => ({jsonrpc: '2.0', id: req.id, ...answer(req)}))
                : {jsonrpc: '2.0', id: payload.id, ...answer(payload)}
            response.setHeader('content-type', 'application/json')
            response.end(JSON.stringify(reply))
        })
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    let {port} = server.address() as AddressInfo

    return {
        url: `http://127.0.0.1:${port}`,
        traceRequests: () => traceRequests,
        close: () => new Promise(resolve => server.close(() => resolve()))
    }
}


describe('selfdestruct recovery against a failing tracer', () => {
    let upstream: Upstream | undefined

    afterEach(async () => {
        await upstream?.close()
        upstream = undefined
    })

    // The dump client retries without limit and treats -32000 as retryable, so an
    // inherited retry policy would repeat the failing trace forever.
    it('gives up after a bounded number of attempts and rejects the block', async () => {
        upstream = await startUpstream()
        let client = new EvmRpcClient({
            url: upstream.url,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            retrySchedule: [0],
            retryInternalServerErrors: true,
            log: null
        })

        let blocks = await new Rpc({client}).getBlockBatch([BLOCK], {
            transactions: true,
            traces: true,
            useDebugTraceBlockByNumber: true
        })

        expect(upstream.traceRequests()).toBe(3)
        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toContain(
            `invalid debug call frames for transaction ${POISONED_TX}: selfdestruct frame 0 has no beneficiary`
        )
    }, 10_000)
})
