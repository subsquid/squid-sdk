import {describe, expect, it, vi} from 'vitest'
import {loadBlock, loadReceipts} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'
import {Rpc} from '../src/rpc'
import {toQty} from '../src/util'

// HyperEVM mainnet block with one HyperCore system transaction, as an endpoint that serves them answered it
const BLOCK = 45009430
const SYSTEM_TX = '0x0acdb9e57e593796276fada08cf87dcb68e3176a777e99cdd322fa9e5e495a52'

function answers() {
    const block = loadBlock('hyperliquid', BLOCK)
    const receipts = loadReceipts('hyperliquid', BLOCK) as any[]
    const systemTx = block.transactions.find((tx: any) => tx.hash === SYSTEM_TX) as any
    // An endpoint backed by the official node: no system transactions, the other logs numbered from 0
    const omitting = {...block, transactions: block.transactions.filter((tx: any) => tx.hash !== SYSTEM_TX)}
    let next = 0
    const omittingReceipts = structuredClone(receipts.filter(r => r.transactionHash !== SYSTEM_TX))
    for (const r of omittingReceipts) for (const log of r.logs) log.logIndex = toQty(next++)
    // eth_getSystemTxsByBlockHash of the official node: the same transaction under its own signature and hash
    const oracleAnswer = [{...systemTx, hash: '0x' + '99'.repeat(32), r: '0x0', s: '0x0', v: '0x7f1'}]
    return {block, receipts, omitting, omittingReceipts, oracleAnswer, systemTx}
}

class CountingClient extends MockRpcClient {
    calls = 0
    async batchCall(batch: any[], options?: any): Promise<any[]> {
        this.calls += 1
        return super.batchCall(batch, options)
    }
}

function setUp(oracleAnswer?: unknown) {
    const client = new MockRpcClient()
    client.setFixture('eth_chainId', undefined, '0x3e7')
    client.setFixture('eth_getBlockReceipts', ['latest'], [])
    const oracle = new CountingClient()
    if (oracleAnswer !== undefined) {
        oracle.setFixture('eth_getSystemTxsByBlockHash', [loadBlock('hyperliquid', BLOCK).hash], oracleAnswer)
    }
    const rpc = new Rpc({
        client: client as any,
        hyperliquidSystemTxOracle: oracle as any,
        verifyTxRoot: true,
        verifyReceiptsRoot: true,
        verifyLogsBloom: true,
        checkLogIndex: true,
    })
    const answer = (body: any, receipts: any[], req: any = {transactions: true, receipts: true}) => {
        client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], body)
        client.setFixture('eth_getBlockReceipts', [toQty(BLOCK)], receipts)
        return rpc.getBlockBatch([BLOCK], req).then(blocks => blocks[0])
    }
    return {answer, oracle}
}

describe('HyperEVM system transaction oracle', () => {
    it('take a block whose system transactions match the oracle by sender and nonce', async () => {
        const {block, receipts, oracleAnswer} = answers()
        const got = await setUp(oracleAnswer).answer(block, receipts)
        expect(got._isInvalid).toBeUndefined()
    })

    it('reject an answer that left a system transaction out of everything and renumbered the logs', async () => {
        const {omitting, omittingReceipts, oracleAnswer, systemTx} = answers()
        const got = await setUp(oracleAnswer).answer(omitting, omittingReceipts)
        expect(got._isInvalid).toBe(true)
        expect(got._errorMessage).toBe(
            `system transaction mismatch: the oracle has system transaction ${systemTx.from.toLowerCase()}:${BigInt(systemTx.nonce)} (sender:nonce), the block body does not`,
        )
    })

    it('reject a body with a system transaction the oracle does not have', async () => {
        const {block, receipts, systemTx} = answers()
        const got = await setUp([]).answer(block, receipts)
        expect(got._isInvalid).toBe(true)
        expect(got._errorMessage).toBe(
            `system transaction mismatch: the block body has system transaction ${systemTx.from.toLowerCase()}:${BigInt(systemTx.nonce)} (sender:nonce), the oracle does not`,
        )
    })

    it('take the block without the oracle check when the oracle fails or does not know the block', async () => {
        const {omitting, omittingReceipts} = answers()
        expect((await setUp().answer(omitting, omittingReceipts))._isInvalid).toBeUndefined()
        expect((await setUp(null).answer(omitting, omittingReceipts))._isInvalid).toBeUndefined()
    })

    it('ask the oracle once for a block hash', async () => {
        const {block, receipts, omitting, omittingReceipts, oracleAnswer} = answers()
        const {answer, oracle} = setUp(oracleAnswer)
        expect((await answer(omitting, omittingReceipts))._isInvalid).toBe(true)
        expect((await answer(block, receipts))._isInvalid).toBeUndefined()
        expect(oracle.calls).toBe(1)
    })

    it('fetch full transactions for the comparison, and give back hashes when only receipts were asked for', async () => {
        const {omitting, omittingReceipts, oracleAnswer} = answers()
        const got = await setUp(oracleAnswer).answer(omitting, omittingReceipts, {receipts: true})
        expect(got._isInvalid).toBe(true)
        expect(got.block.transactions.every((tx: unknown) => typeof tx === 'string')).toBe(true)
    })

    it('keep the answers of a batch in which one block errors', async () => {
        const {oracleAnswer} = answers()
        const oracle = new MockRpcClient()
        oracle.setFixture('eth_getSystemTxsByBlockHash', ['0xaa'], oracleAnswer)
        oracle.setFixture('eth_getSystemTxsByBlockHash', ['0xbb'], {error: {code: -32000, message: 'internal error'}})
        const rpc = new Rpc({client: new MockRpcClient() as any, hyperliquidSystemTxOracle: oracle as any})
        const got: Map<string, Set<string>> = await (rpc as any).askSystemTxOracle([{hash: '0xaa'}, {hash: '0xbb'}])
        expect([...got.keys()]).toEqual(['0xaa'])
        expect(got.get('0xaa')?.size).toBe(1)
    })

    it('give up on an oracle that does not answer, at the deadline', async () => {
        vi.useFakeTimers()
        try {
            const oracle = {url: 'ws://oracle', batchCall: () => new Promise(() => {})}
            const rpc = new Rpc({client: new MockRpcClient() as any, hyperliquidSystemTxOracle: oracle as any})
            const pending: Promise<Map<string, Set<string>>> = (rpc as any).askSystemTxOracle([{hash: '0xaa'}])
            await vi.advanceTimersByTimeAsync(25_000)
            expect((await pending).size).toBe(0)
        } finally {
            vi.useRealTimers()
        }
    })

    it('take a corrected answer after one with a system transaction the oracle rejected', async () => {
        const {block, receipts, omitting, omittingReceipts} = answers()
        const {answer} = setUp([])
        expect((await answer(block, receipts))._errorMessage).toMatch(/the oracle does not$/)
        expect((await answer(omitting, omittingReceipts))._isInvalid).toBeUndefined()
    })

    it('skip only the block whose oracle answer is malformed', async () => {
        const {oracleAnswer} = answers()
        const oracle = new MockRpcClient()
        oracle.setFixture('eth_getSystemTxsByBlockHash', ['0xaa'], [{}])
        oracle.setFixture('eth_getSystemTxsByBlockHash', ['0xbb'], oracleAnswer)
        const rpc = new Rpc({client: new MockRpcClient() as any, hyperliquidSystemTxOracle: oracle as any})
        const got: Map<string, Set<string>> = await (rpc as any).askSystemTxOracle([{hash: '0xaa'}, {hash: '0xbb'}])
        expect([...got.keys()]).toEqual(['0xbb'])
    })

    it('take a corrected answer after one whose receipts alone had a system transaction the oracle rejected', async () => {
        const {receipts, omitting, omittingReceipts} = answers()
        const {answer} = setUp([])
        // the receipts name the system tx, the body does not: rejected, and the receipt is evidence without sender:nonce
        expect((await answer(omitting, receipts))._isInvalid).toBe(true)
        expect((await answer(omitting, omittingReceipts))._isInvalid).toBeUndefined()
    })
})

