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
    const receiptsWithoutSystemTx = receipts.filter(r => r.transactionHash !== SYSTEM_TX)
    return {block, receipts, withoutSystemTx, receiptsWithoutSystemTx}
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
    })
    const answer = (body: any, receipts: any[]) => {
        client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], body)
        client.setFixture('eth_getBlockReceipts', [toQty(BLOCK)], receipts)
        return rpc.getBlockBatch([BLOCK], {transactions: true, receipts: true}).then(blocks => blocks[0])
    }
    return {rpc, answer}
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

    it('mark a block invalid when the body has a system transaction the receipts do not', async () => {
        const {block, receiptsWithoutSystemTx} = answers()
        const got = await setUp().answer(block, receiptsWithoutSystemTx)
        expect(got._isInvalid).toBe(true)
        expect(got._errorMessage).toMatch(/system transaction mismatch|invalid number of receipts/)
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
})
