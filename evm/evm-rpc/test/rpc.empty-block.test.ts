import {describe, expect, it} from 'vitest'
import {Rpc} from '../src/rpc'
import type {DataRequest} from '../src/types'
import {toQty} from '../src/util'
import {loadBlock} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'

const BLOCK = 18000000
const EMPTY_TRIE_ROOT = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'

const PER_TRANSACTION_METHODS = [
    'eth_getBlockReceipts',
    'debug_traceBlockByNumber',
    'trace_block',
    'trace_replayBlockTransactions',
]

/**
 * Answers `[]` to every per-transaction method, and remembers which blocks were asked for
 */
class RecordingClient extends MockRpcClient {
    asked: string[] = []

    async call<T = any>(method: string, params?: any[]): Promise<T> {
        // `latest` is the probe of whether eth_getBlockReceipts is supported at all
        let isProbe = params?.[0] == 'latest'
        if (PER_TRANSACTION_METHODS.includes(method) && !isProbe) {
            this.asked.push(method)
        }
        return super.call(method, params)
    }
}

/**
 * A mainnet block without its transactions, whose header roots say it has none
 */
function makeEmptyBlock() {
    let block = loadBlock('ethereum', BLOCK) as any
    return {
        ...block,
        transactions: [],
        transactionsRoot: EMPTY_TRIE_ROOT,
        receiptsRoot: EMPTY_TRIE_ROOT,
        logsBloom: `0x${'00'.repeat(256)}`,
    }
}

function makeClient(block: any): RecordingClient {
    let client = new RecordingClient()
    client.setFixture('eth_chainId', undefined, '0x1')
    client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], block)
    for (let method of PER_TRANSACTION_METHODS) {
        client.setFixture(method, undefined, [])
    }
    return client
}

const REQUESTS: [string, DataRequest][] = [
    [
        'receipts, debug call frames and debug state diffs',
        {
            transactions: true,
            receipts: true,
            traces: true,
            stateDiffs: true,
            useDebugApiForStateDiffs: true,
            useDebugTraceBlockByNumber: true,
        },
    ],
    ['trace_block traces', {transactions: true, traces: true, useTraceApi: true}],
    ['replayed traces and state diffs', {transactions: true, traces: true, stateDiffs: true, useTraceApi: true}],
]

describe('a block without transactions', () => {
    it.each(REQUESTS)('gets %s without a call when its transactions root proves it empty', async (_, req) => {
        let client = makeClient(makeEmptyBlock())
        let rpc = new Rpc({client: client as any, verifyTxRoot: true, verifyReceiptsRoot: true, verifyLogsBloom: true})

        let [block] = await rpc.getBlockBatch([BLOCK], req)

        expect(client.asked).toEqual([])
        expect(block._isInvalid).toBeFalsy()
        expect(block.receipts).toEqual(req.receipts ? [] : undefined)
        expect(block.debugFrames).toEqual(req.traces && !req.useTraceApi ? [] : undefined)
        expect(block.debugStateDiffs).toEqual(req.useDebugApiForStateDiffs ? [] : undefined)
        expect(block.traceReplays).toEqual(req.useTraceApi ? [] : undefined)
    })

    it.each(REQUESTS)('asks for %s when its transactions root is not checked', async (_, req) => {
        let client = makeClient(makeEmptyBlock())
        let rpc = new Rpc({client: client as any})

        let [block] = await rpc.getBlockBatch([BLOCK], req)

        expect(client.asked).not.toEqual([])
        expect(block._isInvalid).toBeFalsy()
    })
})
