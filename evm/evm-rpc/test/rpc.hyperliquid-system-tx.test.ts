import {describe, expect, it} from 'vitest'
import {loadBlock, loadReceipts} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'
import {Rpc} from '../src/rpc'
import {toQty} from '../src/util'

// HyperEVM mainnet block with one HyperCore system transaction (gas price 0, cumulativeGasUsed 0) that
// emits a log, and two regular transactions, as an endpoint answered it in full.
const BLOCK = 45009430
const SYSTEM_TX = '0x0acdb9e57e593796276fada08cf87dcb68e3176a777e99cdd322fa9e5e495a52'

function answers() {
    const block = loadBlock('hyperliquid', BLOCK)
    const receipts = loadReceipts('hyperliquid', BLOCK) as any[]
    const withoutSystemTx = {
        ...block,
        transactions: block.transactions.filter((tx: any) => tx.hash !== SYSTEM_TX),
    }
    // An answer that leaves the system tx out consistently: the other logs renumbered from 0, as if it never was
    let next = 0
    const receiptsWithoutSystemTx = structuredClone(receipts.filter(r => r.transactionHash !== SYSTEM_TX))
    for (const r of receiptsWithoutSystemTx) for (const log of r.logs) log.logIndex = toQty(next++)
    // The same, without renumbering: the logs skip the system tx's log index
    const receiptsWithLogGap = receipts.filter(r => r.transactionHash !== SYSTEM_TX)
    return {block, receipts, withoutSystemTx, receiptsWithoutSystemTx, receiptsWithLogGap}
}

function setUp(chainId = '0x3e7') {
    const client = new MockRpcClient()
    client.setFixture('eth_chainId', undefined, chainId)
    client.setFixture('eth_getBlockReceipts', ['latest'], [])
    const rpc = new Rpc({
        client: client as any,
        verifyTxRoot: true,
        verifyReceiptsRoot: true,
        verifyLogsBloom: true,
        checkLogIndex: true,
    })
    const answer = (body: any, receipts: any[]) => {
        client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], body)
        client.setFixture('eth_getBlockReceipts', [toQty(BLOCK)], receipts)
        return rpc.getBlockBatch([BLOCK], {transactions: true, receipts: true}).then(blocks => blocks[0])
    }
    // a body with transaction hashes only, as a request that needs no transaction objects gets it
    const answerHashOnly = (body: any, receipts: any[]) => {
        client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), false], {
            ...body,
            transactions: body.transactions.map((tx: any) => tx.hash),
        })
        client.setFixture('eth_getBlockReceipts', [toQty(BLOCK)], receipts)
        return rpc.getBlockBatch([BLOCK], {receipts: true}).then(blocks => blocks[0])
    }
    return {rpc, answer, answerHashOnly}
}

describe('HyperEVM system transactions', () => {
    it('take an answer whose body and receipts both have the system transaction', async () => {
        const {block, receipts} = answers()
        const got = await setUp().answer(block, receipts)
        expect(got._isInvalid).toBeUndefined()
        expect(got.receipts?.some(r => r.transactionHash === SYSTEM_TX)).toBe(true)
    })

    it('mark a block invalid, instead of throwing, when the receipts have a system transaction the body does not', async () => {
        const {withoutSystemTx, receipts} = answers()
        const got = await setUp().answer(withoutSystemTx, receipts)
        expect(got._isInvalid).toBe(true)
        expect(got._errorMessage).toContain(`system transaction mismatch: eth_getBlockReceipts has system transaction ${SYSTEM_TX}`)
    })

    it('mark a block invalid when an answer left a system transaction and its logs out of everything but did not renumber the logs', async () => {
        const {withoutSystemTx, receiptsWithLogGap} = answers()
        const got = await setUp().answer(withoutSystemTx, receiptsWithLogGap)
        expect(got._isInvalid).toBe(true)
        expect(got._errorMessage).toBe(
            "system transaction mismatch: the receipt logs skip log index 0, an answer left out a transaction's logs",
        )
    })

    it('mark a block invalid, with the log index check on, when the body has a system transaction the receipts do not', async () => {
        const {block, receiptsWithLogGap} = answers()
        // without the system tx's receipt the remaining logs start at index 1, which the log index check rejects
        const got = await setUp().answer(block, receiptsWithLogGap)
        expect(got._isInvalid).toBe(true)
        expect(got._errorMessage).toBe(
            `system transaction mismatch: the block body has system transaction ${SYSTEM_TX}, eth_getBlockReceipts does not`,
        )
    })

    it('take no evidence from receipts of another block', async () => {
        const {block, receipts, withoutSystemTx, receiptsWithoutSystemTx} = answers()
        const {answer} = setUp()
        const foreign = receipts.map(r => ({...r, blockHash: '0x' + '11'.repeat(32)}))
        const first = await answer(block, foreign)
        expect(first._errorMessage).toBe('eth_getBlockReceipts returned receipts for a different block')

        // receipts of another block that name the system tx are no evidence about this one: after them, a
        // consistent answer without it is taken (a fresh Rpc, so no body has shown it either)
        const fresh = setUp()
        await fresh.answer(withoutSystemTx, foreign)
        expect((await fresh.answer(withoutSystemTx, receiptsWithoutSystemTx))._isInvalid).toBeUndefined()
    })

    it('hold a hash-only body to an earlier answer that showed a system transaction', async () => {
        const {block, receipts, withoutSystemTx, receiptsWithoutSystemTx} = answers()
        const {answer, answerHashOnly} = setUp()
        expect((await answer(block, receipts))._isInvalid).toBeUndefined()

        const got = await answerHashOnly(withoutSystemTx, receiptsWithoutSystemTx)
        expect(got._isInvalid).toBe(true)
        expect(got._errorMessage).toBe(
            `system transaction mismatch: ${SYSTEM_TX} is in an earlier answer for this block but not in the block body`,
        )
        // a full answer is taken again (with full transaction objects: the logs bloom of a HyperEVM block
        // can only be checked when the body tells which transactions are system ones)
        expect((await answer(block, receipts))._isInvalid).toBeUndefined()
    })

    it('take only an answer with the system transaction once an earlier answer for the block had it', async () => {
        const {block, receipts, withoutSystemTx, receiptsWithoutSystemTx} = answers()
        const {answer} = setUp()

        // the first answer shows it in the receipts only
        expect((await answer(withoutSystemTx, receipts))._isInvalid).toBe(true)

        // the second leaves it out of both: consistent on its own, but an earlier answer had it
        const second = await answer(withoutSystemTx, receiptsWithoutSystemTx)
        expect(second._isInvalid).toBe(true)
        expect(second._errorMessage).toBe(
            `system transaction mismatch: ${SYSTEM_TX} is in an earlier answer for this block but not in the block body`,
        )

        // a full answer is taken
        expect((await answer(block, receipts))._isInvalid).toBeUndefined()
    })

    it('can not tell a first answer without the system transaction anywhere from a block without one', async () => {
        const {withoutSystemTx, receiptsWithoutSystemTx} = answers()
        const got = await setUp().answer(withoutSystemTx, receiptsWithoutSystemTx)
        expect(got._isInvalid).toBeUndefined()
    })

    it('mark a block invalid on any chain when the receipts name a transaction the body does not have', async () => {
        const {withoutSystemTx, receipts} = answers()
        const got = await setUp('0x1').answer(withoutSystemTx, receipts)
        expect(got._isInvalid).toBe(true)
        expect(got._errorMessage).toBe(
            `eth_getBlockReceipts has a receipt of transaction ${SYSTEM_TX}, which is not in the block body`,
        )
    })

    describe('on the eth_getTransactionReceipt path', () => {
        function setUpByTx() {
            const client = new MockRpcClient()
            client.setFixture('eth_chainId', undefined, '0x3e7')
            // no fixture for eth_getBlockReceipts: the probe fails and receipts are fetched per transaction
            const rpc = new Rpc({
                client: client as any,
                verifyTxRoot: true,
                verifyReceiptsRoot: true,
                verifyLogsBloom: true,
                checkLogIndex: true,
            })
            const answer = (body: any, receipts: any[], hashOnly = false) => {
                const all = answers()
                for (const tx of all.block.transactions) {
                    client.setFixture('eth_getTransactionReceipt', [tx.hash], receipts.find(r => r.transactionHash === tx.hash) ?? null)
                }
                client.setFixture(
                    'eth_getBlockByNumber',
                    [toQty(BLOCK), !hashOnly],
                    hashOnly ? {...body, transactions: body.transactions.map((tx: any) => tx.hash)} : body,
                )
                return rpc
                    .getBlockBatch([BLOCK], hashOnly ? {receipts: true} : {transactions: true, receipts: true})
                    .then(blocks => blocks[0])
            }
            return {answer}
        }

        it('mark a block invalid, instead of throwing, when an answer left a system transaction out without renumbering the logs', async () => {
            const {withoutSystemTx, receiptsWithLogGap} = answers()
            const got = await setUpByTx().answer(withoutSystemTx, receiptsWithLogGap)
            expect(got._isInvalid).toBe(true)
            expect(got._errorMessage).toBe(
                "system transaction mismatch: the receipt logs skip log index 0, an answer left out a transaction's logs",
            )
        })

        it('keep the evidence of a partial answer', async () => {
            const {block, receipts, withoutSystemTx, receiptsWithoutSystemTx} = answers()
            const {answer} = setUpByTx()
            // a hash-only body with every transaction, receipts only for the system tx: rejected, but evidence
            const partial = receipts.filter(r => r.transactionHash === SYSTEM_TX)
            const first = await answer(block, partial, true)
            expect(first._isInvalid).toBe(true)
            expect(first._errorMessage).toBe('failed to get receipts for all transactions')

            // a consistent answer without the system tx is then rejected
            const second = await answer(withoutSystemTx, receiptsWithoutSystemTx)
            expect(second._isInvalid).toBe(true)
            expect(second._errorMessage).toBe(
                `system transaction mismatch: ${SYSTEM_TX} is in an earlier answer for this block but not in the block body`,
            )
        })
    })

    describe('on the eth_getLogs path', () => {
        it('mark a block invalid, instead of throwing, when a log names a system transaction the body left out', async () => {
            const {block, receipts, withoutSystemTx} = answers()
            const logs = receipts.flatMap((r: any) => r.logs)
            const client = new MockRpcClient()
            client.setFixture('eth_chainId', undefined, '0x3e7')
            const rpc = new Rpc({client: client as any, verifyTxRoot: true, verifyLogsBloom: true, checkLogIndex: true})
            const answer = (body: any) => {
                client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], body)
                client.setFixture('eth_getLogs', [{fromBlock: toQty(BLOCK), toBlock: toQty(BLOCK)}], logs)
                return rpc.getBlockBatch([BLOCK], {transactions: true, logs: true}).then(blocks => blocks[0])
            }

            expect((await answer(block))._isInvalid).toBeUndefined()
            const got = await answer(withoutSystemTx)
            expect(got._isInvalid).toBe(true)
            expect(got._errorMessage).toBe(
                `system transaction mismatch: eth_getLogs has a log of transaction ${SYSTEM_TX}, the block body does not`,
            )
        })
    })
})

