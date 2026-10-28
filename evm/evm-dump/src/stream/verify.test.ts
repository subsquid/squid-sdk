import type {RawBlock, RawTransaction} from '@subsquid/evm-normalization'
import {ChainUtils} from '@subsquid/evm-rpc'
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

describe('block access lists', () => {
    it('are not taken from the stream', async () => {
        let block = makeBlock(100)
        block.blockAccessList_ = []

        expect(await verify(block, {})).toMatchObject({reason: 'verify', details: 'unexpected block access list'})
    })
})

describe('transaction hashes', () => {
    /**
     * Gives a transaction with logs another hash everywhere the block refers to it
     */
    function renameTransaction(withReceipts: boolean): RawBlock {
        let block = loadMainnetBlock()
        let tx = block.transactions.find((tx) => tx.receipt_!.logs.length > 0)!
        let real = tx.hash
        let forged = makeHash('forged transaction')

        tx.hash = forged
        tx.receipt_!.transactionHash = forged
        for (let log of tx.receipt_!.logs) {
            log.transactionHash = forged
        }

        if (!withReceipts) {
            block.logs_ = block.transactions.flatMap((tx) => tx.receipt_!.logs)
            for (let tx of block.transactions) {
                tx.receipt_ = undefined
            }
        }

        expect(block.logs_?.some((log) => log.transactionHash === real) ?? false).toBe(false)
        return block
    }

    it.each([false, true])('must be of their transactions with receipts=%s', async (withReceipts) => {
        let options: ComponentOptions = {
            withReceipts,
            verifyTxRoot: true,
            verifyTxSender: true,
            verifyReceiptsRoot: withReceipts,
            verifyLogsBloom: true,
        }

        expect(await verify(renameTransaction(withReceipts), options)).toMatchObject({
            reason: 'verify',
            details: expect.stringContaining('hashes to'),
        })
    })

    it('are not checked without the transactions root', async () => {
        expect(await verify(renameTransaction(true), {withReceipts: true})).toBeUndefined()
    })
})

describe('log data', () => {
    function changeLogData(block: RawBlock): RawBlock {
        let changed = structuredClone(block)
        let logs = changed.logs_ ?? changed.transactions.flatMap((tx) => tx.receipt_!.logs)
        let log = logs.find((log) => /[1-9a-f]/.test(log.data.slice(2)))!

        log.data = `0x${'00'.repeat((log.data.length - 2) / 2)}`
        return changed
    }

    it('is tied to the header by the receipts root', async () => {
        let options: ComponentOptions = {withReceipts: true, verifyTxRoot: true, verifyReceiptsRoot: true}

        expect(await verify(changeLogData(loadMainnetBlock()), options)).toMatchObject({reason: 'verify'})
    })

    it('is not tied to the header by a logs bloom', async () => {
        let block = loadMainnetBlock()
        block.logs_ = block.transactions.flatMap((tx) => tx.receipt_!.logs)
        for (let tx of block.transactions) {
            tx.receipt_ = undefined
        }

        let options: ComponentOptions = {verifyTxRoot: true, verifyLogsBloom: true}

        expect(await verify(changeLogData(block), options)).toBeUndefined()
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

    it('may be absent where the chain answers an empty frame for the transaction', async () => {
        let block = changeTransaction(loadTracedBlock(), 0, (tx) => {
            tx.type = '0x7e'
            ;(tx as any).queueIndex = '0x1'
            tx.debugFrame_ = undefined
        })

        let scroll = createLineVerifier(new ChainUtils('0x82750'), {withTraces: true})
        expect(await scroll(block, linkOf(block))).toBeUndefined()

        expect(await verify(block, {withTraces: true})).toMatchObject({
            reason: 'verify',
            details: expect.stringContaining('call frames is missing'),
        })
    })

    it('are not expected in a genesis block', async () => {
        expect(await verify(makeBlock(0), {withTraces: true})).toBeUndefined()
    })
})
