import * as fs from 'fs'
import * as http from 'http'
import {AddressInfo} from 'net'
import * as Path from 'path'
import {afterEach, describe, expect, it} from 'vitest'
import {Rpc} from '../src/rpc'
import {EvmRpcClient} from '../src/rpc-client'
import {getChainId, loadBlock, loadDebugFrames} from './helpers/fixture-loader'


// Ethereum Sepolia block 11319411 as served by a provider that drops the payload
// of the selfdestruct frame in transaction 17, a selfdestruct-to-self.
const CHAIN = 'ethereum-sepolia'
const BLOCK = 11319411
const POISONED_INDEX = 17
const POISONED_TX = '0xf6c6e39b79667c78858e4c5b924a22d834427d7287e8a3b26219fe5dce180065'

// The SELFDESTRUCT steps of its opcode log and its prestate, recorded from a node
// that serves both.
const EVIDENCE = JSON.parse(fs.readFileSync(
    Path.join(__dirname, 'fixtures', CHAIN, String(BLOCK), 'selfdestruct-builtin.json'),
    'utf-8'
))


interface Behaviour {
    /** The block `eth_getTransactionByHash` reports the transaction in. */
    includedIn?: (blockHash: string) => string
    prestate?: () => unknown
}


interface Upstream {
    url: string
    requests: () => string[]
    close: () => Promise<void>
}


/**
 * Serves the recorded block, its malformed call traces and the built-in tracers,
 * and refuses a custom JS tracer the way a provider with them disabled does.
 */
async function startUpstream(behaviour: Behaviour = {}): Promise<Upstream> {
    let block = loadBlock(CHAIN, BLOCK)
    let frames = loadDebugFrames(CHAIN, BLOCK, 'malformed')
    let requests: string[] = []

    let answer = (req: any) => {
        switch (req.method) {
            case 'eth_chainId':
                return {result: getChainId(CHAIN)}
            case 'eth_getBlockByNumber':
                return {result: block}
            case 'debug_traceBlockByNumber':
                return {result: frames}
            case 'eth_getTransactionByHash': {
                requests.push('eth_getTransactionByHash')
                let blockHash = behaviour.includedIn?.(block.hash) ?? block.hash
                return {result: {hash: req.params[0], blockHash, blockNumber: block.number}}
            }
            case 'debug_traceTransaction': {
                let config = req.params[1] ?? {}
                if (typeof config.tracer === 'string' && config.tracer.includes('function')) {
                    requests.push('js')
                    return {error: {code: -32000, message: 'custom tracer is not permitted'}}
                }
                if (config.tracer === 'prestateTracer') {
                    requests.push('prestateTracer')
                    return {result: behaviour.prestate?.() ?? EVIDENCE.prestate}
                }
                requests.push('opcodeLogger')
                return {result: {failed: false, gas: 0, returnValue: '', structLogs: EVIDENCE.steps}}
            }
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
        requests: () => requests,
        close: () => new Promise(resolve => server.close(() => resolve()))
    }
}


function fetchBlock(url: string) {
    let client = new EvmRpcClient({
        url,
        retryAttempts: Number.MAX_SAFE_INTEGER,
        retrySchedule: [0],
        retryInternalServerErrors: true,
        log: null
    })
    return new Rpc({client}).getBlockBatch([BLOCK], {
        transactions: true,
        traces: true,
        useDebugTraceBlockByNumber: true
    })
}


describe('selfdestruct recovery from built-in tracers', () => {
    let upstream: Upstream | undefined

    afterEach(async () => {
        await upstream?.close()
        upstream = undefined
    })

    it('repairs the frame without the custom tracer the upstream refuses', async () => {
        upstream = await startUpstream()

        let blocks = await fetchBlock(upstream.url)

        expect(blocks[0]._isInvalid).toBeFalsy()
        // The two recordings come from different providers, which number logs
        // differently; the selfdestruct frame is what the repair writes.
        let complete = loadDebugFrames(CHAIN, BLOCK)[POISONED_INDEX].result.calls[0]
        let repaired = blocks[0].debugFrames![POISONED_INDEX]!.result.calls![0]
        expect({type: repaired.type, from: repaired.from, to: repaired.to, value: repaired.value})
            .toEqual({type: complete.type, from: complete.from, to: complete.to, value: complete.value})
        expect(upstream.requests()).toEqual([
            'eth_getTransactionByHash', 'opcodeLogger', 'prestateTracer', 'eth_getTransactionByHash'
        ])
    }, 10_000)

    it('refuses a transaction that a reorg moved to another block', async () => {
        upstream = await startUpstream({
            includedIn: () => '0x' + 'ab'.repeat(32)
        })

        let blocks = await fetchBlock(upstream.url)

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toContain(
            `invalid debug call frames for transaction ${POISONED_TX}: selfdestruct frame 0 has no beneficiary`
        )
        expect(upstream.requests()).not.toContain('opcodeLogger')
    }, 10_000)

    it('falls back to the custom tracer when the prestate does not name the account', async () => {
        upstream = await startUpstream({prestate: () => ({})})

        let blocks = await fetchBlock(upstream.url)

        expect(blocks[0]._isInvalid).toBe(true)
        expect(upstream.requests()).toContain('js')
    }, 10_000)
})
