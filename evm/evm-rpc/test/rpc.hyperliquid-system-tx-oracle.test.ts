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

    it('ask the oracle once for a block hash while its answer agrees, and again after it disagreed', async () => {
        const {block, receipts, omitting, omittingReceipts, oracleAnswer} = answers()
        const {answer, oracle} = setUp(oracleAnswer)
        expect((await answer(block, receipts))._isInvalid).toBeUndefined()
        expect((await answer(block, receipts))._isInvalid).toBeUndefined()
        expect(oracle.calls).toBe(1)

        // a fresh Rpc whose first answer the oracle rejects (no evidence yet, so the oracle check decides)
        const second = setUp(oracleAnswer)
        expect((await second.answer(omitting, omittingReceipts))._isInvalid).toBe(true)
        expect((await second.answer(block, receipts))._isInvalid).toBeUndefined()
        expect(second.oracle.calls).toBe(2)
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

    describe('when the oracle is required', () => {
        function setUpRequired(oracle: unknown, chainId = '0x3e7', verify = true) {
            const client = new MockRpcClient()
            client.setFixture('eth_chainId', undefined, chainId)
            client.setFixture('eth_getBlockReceipts', ['latest'], [])
            const rpc = new Rpc({
                client: client as any,
                hyperliquidSystemTxOracle: oracle as any,
                requireHyperliquidSystemTxOracle: true,
                // another chain hashes the system transaction into the roots, which this block's header does not
                verifyTxRoot: verify,
                verifyReceiptsRoot: verify,
                verifyLogsBloom: verify,
                checkLogIndex: true,
            })
            const answer = (body: any, receipts: any[]) => {
                client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], body)
                client.setFixture('eth_getBlockReceipts', [toQty(BLOCK)], receipts)
                return rpc.getBlockBatch([BLOCK], {transactions: true, receipts: true}).then(blocks => blocks[0])
            }
            return {answer}
        }

        // answers null (a block the official node has not seen yet) the first `misses` times it is asked
        class LateOracle extends CountingClient {
            constructor(private misses: number, answer: unknown) {
                super()
                this.setFixture('eth_getSystemTxsByBlockHash', [loadBlock('hyperliquid', BLOCK).hash], answer)
            }
            async batchCall(batch: any[], options?: any): Promise<any[]> {
                if (this.calls < this.misses) {
                    this.calls += 1
                    return batch.map(() => null)
                }
                return super.batchCall(batch, options)
            }
        }

        it('ask again for a block the oracle does not know yet, and take it once it answers', async () => {
            vi.useFakeTimers()
            try {
                const {block, receipts, oracleAnswer} = answers()
                const oracle = new LateOracle(2, oracleAnswer)
                const pending = setUpRequired(oracle).answer(block, receipts)
                await vi.advanceTimersByTimeAsync(5_000)
                expect((await pending)._isInvalid).toBeUndefined()
                expect(oracle.calls).toBe(3)
            } finally {
                vi.useRealTimers()
            }
        })

        it('mark a block invalid when the oracle keeps answering that it does not know it', async () => {
            vi.useFakeTimers()
            try {
                const {block, receipts, oracleAnswer} = answers()
                const oracle = new LateOracle(Infinity, oracleAnswer)
                const pending = setUpRequired(oracle).answer(block, receipts)
                await vi.advanceTimersByTimeAsync(5_000)
                const got = await pending
                expect(got._isInvalid).toBe(true)
                expect(got._errorMessage).toBe('system transaction oracle does not know the block hash')
                expect(oracle.calls).toBe(4)
            } finally {
                vi.useRealTimers()
            }
        })

        // fails (the whole call, or with an error for the block) the first `failures` times it is asked
        class DownOracle extends CountingClient {
            constructor(private failures: number, private itemError: boolean, answer: unknown) {
                super()
                this.setFixture('eth_getSystemTxsByBlockHash', [loadBlock('hyperliquid', BLOCK).hash], answer)
            }
            async batchCall(batch: any[], options?: any): Promise<any[]> {
                if (this.calls < this.failures) {
                    this.calls += 1
                    if (!this.itemError) throw new Error('connection refused')
                    return batch.map(req => options.validateError({code: -32005, message: 'rate limited'}, req))
                }
                return super.batchCall(batch, options)
            }
        }

        for (const itemError of [false, true]) {
            it(`wait for an oracle that is unavailable (${itemError ? 'an error for the block' : 'the call fails'}), spending no retries of the block`, async () => {
                vi.useFakeTimers()
                try {
                    const {block, receipts, oracleAnswer} = answers()
                    // far more failures than the asks a block that the oracle does not know gets
                    const oracle = new DownOracle(12, itemError, oracleAnswer)
                    let settled = false
                    const pending = setUpRequired(oracle).answer(block, receipts).finally(() => (settled = true))
                    await vi.advanceTimersByTimeAsync(60_000)
                    expect(settled).toBe(false)
                    await vi.advanceTimersByTimeAsync(10 * 60_000)
                    const got = await pending
                    expect(got._isInvalid).toBeUndefined()
                    expect(oracle.calls).toBe(13)
                } finally {
                    vi.useRealTimers()
                }
            })
        }

        it('stop waiting for an unavailable oracle once the batch fails for another reason', async () => {
            vi.useFakeTimers()
            try {
                const {block} = answers()
                class FailingReceipts extends MockRpcClient {
                    async batchCall(batch: any[], options?: any): Promise<any[]> {
                        if (batch.some(req => req.method === 'eth_getBlockReceipts' && req.params?.[0] !== 'latest')) {
                            throw new Error('source RPC down')
                        }
                        return super.batchCall(batch, options)
                    }
                }
                const client = new FailingReceipts()
                client.setFixture('eth_chainId', undefined, '0x3e7')
                client.setFixture('eth_getBlockReceipts', ['latest'], [])
                client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], block)
                const oracle = new DownOracle(Infinity, false, [])
                const rpc = new Rpc({client: client as any, hyperliquidSystemTxOracle: oracle as any, requireHyperliquidSystemTxOracle: true})
                const pending = rpc.getBlockBatch([BLOCK], {transactions: true, receipts: true})
                const failed = expect(pending).rejects.toThrow('source RPC down')
                await vi.advanceTimersByTimeAsync(1_000)
                await failed
                const calls = oracle.calls
                await vi.advanceTimersByTimeAsync(10 * 60_000)
                expect(oracle.calls).toBe(calls)
            } finally {
                vi.useRealTimers()
            }
        })

        it('await a call still queued past its deadline instead of sending another', async () => {
            vi.useFakeTimers()
            try {
                const {block, receipts} = answers()
                let calls = 0
                let release: (results: any[]) => void = () => {}
                const oracle = {
                    url: 'ws://oracle',
                    batchCall: () => {
                        calls += 1
                        return new Promise<any[]>(resolve => (release = resolve))
                    },
                }
                let settled = false
                const pending = setUpRequired(oracle).answer(block, receipts).finally(() => (settled = true))
                await vi.advanceTimersByTimeAsync(5 * 60_000)
                expect(settled).toBe(false)
                expect(calls).toBe(1)
                // the oracle reconnects and the one queued call is answered
                release([answers().oracleAnswer])
                await vi.advanceTimersByTimeAsync(60_000)
                expect((await pending)._isInvalid).toBeUndefined()
                expect(calls).toBe(1)
            } finally {
                vi.useRealTimers()
            }
        })

        it("make the oracle from the chain's official RPC URL, once", async () => {
            const {block, receipts, oracleAnswer} = answers()
            const urls: string[] = []
            const factory = (url: string) => {
                urls.push(url)
                const oracle = new MockRpcClient()
                oracle.setFixture('eth_getSystemTxsByBlockHash', [block.hash], oracleAnswer)
                return oracle
            }
            const {answer} = setUpRequired(factory)
            expect((await answer(block, receipts))._isInvalid).toBeUndefined()
            expect((await answer(block, receipts))._isInvalid).toBeUndefined()
            expect(urls).toEqual(['https://rpc.hyperliquid.xyz/evm'])
        })

        it('throw on HyperEVM without an oracle, and ignore the requirement on other chains', async () => {
            const {block, receipts} = answers()
            await expect(setUpRequired(undefined).answer(block, receipts)).rejects.toThrow(
                'HyperEVM: a system transaction oracle is required, and none is configured',
            )
            const factory = vi.fn()
            const got = await setUpRequired(factory, '0x1', false).answer(block, receipts)
            expect(got._isInvalid).toBeUndefined()
            expect(factory).not.toHaveBeenCalled()
        })
    })
})
