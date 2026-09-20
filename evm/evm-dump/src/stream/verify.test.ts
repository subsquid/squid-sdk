import type {RawBlock, RawTransaction} from '@subsquid/evm-normalization'
import {describe, expect, it} from 'vitest'
import type {ComponentOptions} from './components'
import {linkOf, loadMainnetBlock, makeBlock, makeHash, testChainUtils} from './test-util'
import {createLineVerifier} from './verify'

/**
 * A mainnet block the way a dumper running `--with-traces` writes it
 */
function loadTracedBlock(): RawBlock {
    let block = loadMainnetBlock()

    block.logs_ = block.transactions.flatMap((tx) => tx.receipt_!.logs)

    for (let tx of block.transactions) {
        tx.receipt_ = undefined

        tx.debugFrame_ = {
            txHash: tx.hash,
            result: {
                type: tx.to == null ? 'CREATE' : 'CALL',
                from: tx.from,
                to: tx.to ?? `0x${'11'.repeat(20)}`,
                input: tx.input,
                value: tx.value,
                gas: tx.gas,
                gasUsed: '0x5208',
            },
        }
    }

    return block
}

function verify(block: RawBlock, options: ComponentOptions) {
    let verifyLine = createLineVerifier(testChainUtils, options)
    return verifyLine(block, linkOf(block))
}

function changeTransaction(block: RawBlock, index: number, change: (tx: RawTransaction) => void): RawBlock {
    let changed = structuredClone(block)
    change(changed.transactions[index])
    return changed
}

describe.each([false, true])('log associations with receipts=%s', (withReceipts) => {
    const options: ComponentOptions = {
        withReceipts,
        verifyTxRoot: true,
        verifyTxSender: true,
        verifyReceiptsRoot: withReceipts,
        verifyLogsBloom: true,
    }

    function loadBlock(): RawBlock {
        let block = loadMainnetBlock()
        if (!withReceipts) {
            block.logs_ = block.transactions.flatMap((tx) => tx.receipt_!.logs)
            for (let tx of block.transactions) {
                tx.receipt_ = undefined
            }
        }

        return block
    }

    function firstLog(block: RawBlock) {
        return withReceipts
            ? block.transactions.find((tx) => tx.receipt_!.logs.length > 0)!.receipt_!.logs[0]
            : block.logs_![0]
    }

    it('accepts logs associated with their own transactions', async () => {
        expect(await verify(loadBlock(), options)).toBeUndefined()
    })

    it.each(['another transaction', 'missing transaction'])(
        'rejects a log whose index points to %s',
        async (target) => {
            let block = loadBlock()
            let log = firstLog(block)
            let index =
                target === 'another transaction'
                    ? (Number(log.transactionIndex) + 1) % block.transactions.length
                    : block.transactions.length
            log.transactionIndex = `0x${index.toString(16)}`

            expect(await verify(block, options)).toMatchObject({
                reason: 'verify',
                details: expect.stringContaining('log is of another transaction'),
            })
        },
    )

    it('rejects a log whose hash does not match its transaction', async () => {
        let block = loadBlock()
        firstLog(block).transactionHash = makeHash('another transaction')

        expect(await verify(block, options)).toMatchObject({
            reason: 'verify',
            details: expect.stringContaining('log is of another transaction'),
        })
    })
})

describe('call frames of a stream block', () => {
    it('are taken when every transaction has them', async () => {
        let block = loadTracedBlock()

        expect(await verify(block, {withTraces: true})).toBeUndefined()
        expect(await verify(block, {withTraces: true, callFrameValidation: 'reject'})).toBeUndefined()
    })

    it('must be there when the dumper fetches them', async () => {
        let block = changeTransaction(loadTracedBlock(), 5, (tx) => {
            tx.debugFrame_ = undefined
        })

        expect(await verify(block, {withTraces: true})).toMatchObject({reason: 'verify'})
    })

    it('must not be there when the dumper does not fetch them', async () => {
        expect(await verify(loadTracedBlock(), {})).toMatchObject({reason: 'verify'})
    })

    it('must be of their own transaction', async () => {
        let block = changeTransaction(loadTracedBlock(), 5, (tx) => {
            tx.debugFrame_!.txHash = makeHash('another transaction')
        })

        expect(await verify(block, {withTraces: true})).toMatchObject({reason: 'verify'})
    })

    it('must be fit for mapping', async () => {
        let block = changeTransaction(loadTracedBlock(), 5, (tx) => {
            tx.debugFrame_!.result.type = 'JUMP'
        })

        expect(await verify(block, {withTraces: true})).toMatchObject({reason: 'verify'})
    })

    it('must agree with the transaction when the dumper rejects those that do not', async () => {
        let block = changeTransaction(loadTracedBlock(), 5, (tx) => {
            tx.debugFrame_!.result.from = `0x${'22'.repeat(20)}`
        })

        expect(await verify(block, {withTraces: true})).toBeUndefined()
        expect(await verify(block, {withTraces: true, callFrameValidation: 'reject'})).toMatchObject({reason: 'verify'})
    })

    it('are not expected in a genesis block', async () => {
        expect(await verify(makeBlock(0), {withTraces: true})).toBeUndefined()
    })
})
