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
    let verifyLine = createLineVerifier(testChainUtils, {verifyBlockHash: true, ...options})
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

describe('a header without --verify-block-hash', () => {
    const options: ComponentOptions = {withReceipts: true, verifyTxRoot: true, verifyReceiptsRoot: true}

    /**
     * A block of a chain whose header hash RPC fields do not give, the hash it states is all there is
     */
    function loadUnhashableBlock(): RawBlock {
        let block = loadMainnetBlock()
        let hash = makeHash('unhashable header')

        block.hash = hash
        for (let tx of block.transactions) {
            tx.blockHash = hash
            tx.receipt_!.blockHash = hash
            for (let log of tx.receipt_!.logs) {
                log.blockHash = hash
            }
        }

        return block
    }

    it('is taken for the hash it states', async () => {
        let block = loadUnhashableBlock()

        expect(await verify(block, options)).toMatchObject({reason: 'hash'})
        expect(await verify(block, {...options, verifyBlockHash: false})).toBeUndefined()
    })

    it('still ties the body to its roots', async () => {
        let block = changeTransaction(loadUnhashableBlock(), 3, (tx) => {
            tx.value = '0xde0b6b3a7640000'
        })

        expect(await verify(block, {...options, verifyBlockHash: false})).toMatchObject({
            reason: 'verify',
            details: 'failed to verify transactions root',
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

describe('consensus anchors of a stream block', () => {
    /**
     * A mainnet block with receipts and call frames, each root frame agreeing with its receipt
     */
    function loadAnchoredBlock(): RawBlock {
        let block = loadMainnetBlock()
        for (let tx of block.transactions) {
            tx.debugFrame_ = {
                txHash: tx.hash,
                result: {
                    type: tx.to == null ? 'CREATE' : 'CALL',
                    from: tx.from,
                    to: tx.to ?? `0x${'11'.repeat(20)}`,
                    input: tx.input,
                    value: tx.value,
                    gas: tx.gas,
                    gasUsed: tx.receipt_!.gasUsed,
                    ...(Number(tx.receipt_!.status) == 0 ? {error: 'execution reverted'} : {}),
                },
            }
        }
        return block
    }

    const options: ComponentOptions = {withReceipts: true, withTraces: true, verifyReceiptsRoot: true}

    function check(block: RawBlock, mode: string, rules?: ComponentOptions['consensusAnchorRules'], seen?: any[]) {
        let verifyLine = createLineVerifier(
            testChainUtils,
            {verifyBlockHash: true, ...options, consensusAnchorValidation: mode, consensusAnchorRules: rules},
            {onConsensusAnchorViolation: (o) => seen?.push(o)},
        )
        return verifyLine(block, linkOf(block))
    }

    it('take a block whose traces agree with the receipts', async () => {
        let block = loadAnchoredBlock()
        expect(await check(block, 'reject')).toBeUndefined()
        expect(await check(block, 'reject', ['status', 'gas'])).toBeUndefined()
    })

    it('send a block whose root frame used other gas than its receipt to RPC under reject', async () => {
        let block = changeTransaction(loadAnchoredBlock(), 5, (tx) => {
            tx.debugFrame_!.result.gasUsed = '0x1'
        })

        expect(await check(block, 'reject')).toMatchObject({
            reason: 'verify',
            details: expect.stringContaining('consensus anchor violation (gas)'),
        })
        expect(await check(block, 'off')).toBeUndefined()
    })

    it('send a block whose root frame failed under a successful receipt to RPC under reject', async () => {
        let block = changeTransaction(loadAnchoredBlock(), 5, (tx) => {
            tx.debugFrame_!.result.error = 'execution reverted'
        })

        expect(await check(block, 'reject', ['status'])).toMatchObject({
            reason: 'verify',
            details: expect.stringContaining('consensus anchor violation (status)'),
        })
    })

    it('take the block under observe and report each violating transaction', async () => {
        let block = changeTransaction(loadAnchoredBlock(), 5, (tx) => {
            tx.debugFrame_!.result.gasUsed = '0x1'
        })
        block = changeTransaction(block, 7, (tx) => {
            tx.debugFrame_!.result.gasUsed = '0x2'
        })

        let seen: any[] = []
        expect(await check(block, 'observe', undefined, seen)).toBeUndefined()
        expect(seen.map((o) => o.transactionIndex)).toEqual([5, 7])
        expect(seen[0]).toMatchObject({
            blockNumber: Number(block.number),
            transactionHash: block.transactions[5].hash,
            violations: [{rule: 'gas'}],
        })
    })

    it('leave a zero-priced transaction with a zero-gas receipt out of the gas rule', async () => {
        // HyperEVM's HyperCore system transactions: gas price 0, receipt gasUsed 0, a root frame that uses gas.
        // Receipts root and cumulative gas checks are off, so changing the receipt only touches the anchor.
        let block = changeTransaction(loadAnchoredBlock(), 5, (tx) => {
            tx.debugFrame_!.result.gasUsed = '0x5208'
        })
        let verifyLine = createLineVerifier(testChainUtils, {
            verifyBlockHash: true,
            withReceipts: true,
            withTraces: true,
            skipCumulativeGasUsedCheck: true,
            consensusAnchorValidation: 'reject',
        })
        let tx = block.transactions[5]
        tx.receipt_!.gasUsed = '0x0'
        tx.gasPrice = '0x1'
        expect(await verifyLine(block, linkOf(block))).toMatchObject({
            details: expect.stringContaining('consensus anchor violation (gas)'),
        })
        tx.gasPrice = '0x0'
        expect(await verifyLine(block, linkOf(block))).toBeUndefined()
    })

    const SYS = '0xfffffffffffffffffffffffffffffffffffffffe'

    function feeOf(tx: RawTransaction): bigint {
        return BigInt(tx.receipt_!.gasUsed) * BigInt(tx.receipt_!.effectiveGasPrice ?? tx.gasPrice ?? '0x0')
    }

    /**
     * Each transaction's state diff credits its fee to the system address, the way BSC does
     */
    function withFeeCredits(block: RawBlock, shape: 'replay' | 'prestate'): RawBlock {
        for (let tx of block.transactions) {
            let fee = '0x' + feeOf(tx).toString(16)
            if (shape == 'replay') {
                tx.traceReplay_ = {
                    transactionHash: tx.hash,
                    stateDiff: {[SYS]: {balance: {'*': {from: '0x0', to: fee}}, code: '=', nonce: '=', storage: {}}},
                } as any
            } else {
                tx.debugStateDiff_ = {
                    txHash: tx.hash,
                    result: {pre: {[SYS]: {balance: '0x0'}}, post: {[SYS]: {balance: fee}}},
                }
            }
        }
        return block
    }

    function withCredit(tx: RawTransaction, shape: 'replay' | 'prestate', credit: bigint): void {
        let value = '0x' + credit.toString(16)
        if (shape == 'replay') {
            ;(tx.traceReplay_ as any).stateDiff[SYS].balance = {'*': {from: '0x0', to: value}}
        } else {
            tx.debugStateDiff_!.result.post[SYS].balance = value
        }
    }

    describe.each(['replay', 'prestate'] as const)('with %s state diffs', (shape) => {
        const diffOptions: ComponentOptions = {
            ...options,
            withStatediffs: true,
            useDebugApiForStatediffs: shape == 'prestate',
        }
        const rules: ComponentOptions['consensusAnchorRules'] = ['status', 'gas', 'system-fee']

        function checkDiffs(block: RawBlock, mode: string, seen?: any[]) {
            let verifyLine = createLineVerifier(
                testChainUtils,
                {verifyBlockHash: true, ...diffOptions, consensusAnchorValidation: mode, consensusAnchorRules: rules},
                {onConsensusAnchorViolation: (o) => seen?.push(o)},
            )
            return verifyLine(block, linkOf(block))
        }

        it('take a block whose system-address credits equal the fees', async () => {
            expect(await checkDiffs(withFeeCredits(loadAnchoredBlock(), shape), 'reject')).toBeUndefined()
        })

        it('send a block with a wrong credit to RPC under reject, and report it under observe', async () => {
            let block = changeTransaction(withFeeCredits(loadAnchoredBlock(), shape), 5, (tx) => {
                withCredit(tx, shape, feeOf(tx) + 1n)
            })

            expect(await checkDiffs(block, 'reject')).toMatchObject({
                reason: 'verify',
                details: expect.stringContaining('consensus anchor violation (system-fee)'),
            })

            let seen: any[] = []
            expect(await checkDiffs(block, 'observe', seen)).toBeUndefined()
            expect(seen).toMatchObject([{transactionIndex: 5, violations: [{rule: 'system-fee'}]}])
        })

        it('send a block whose diff leaves the credit out to RPC', async () => {
            let block = changeTransaction(withFeeCredits(loadAnchoredBlock(), shape), 5, (tx) => {
                if (shape == 'replay') {
                    ;(tx.traceReplay_ as any).stateDiff = {}
                } else {
                    tx.debugStateDiff_!.result = {pre: {}, post: {}}
                }
            })

            expect(feeOf(block.transactions[5])).toBeGreaterThan(0n)
            expect(await checkDiffs(block, 'reject')).toMatchObject({
                details: expect.stringContaining('consensus anchor violation (system-fee)'),
            })
        })

        it('send a block whose prestate diff is of another transaction to RPC', async () => {
            if (shape != 'prestate') return
            let block = changeTransaction(withFeeCredits(loadAnchoredBlock(), shape), 5, (tx) => {
                tx.debugStateDiff_!.txHash = makeHash('another transaction')
            })
            // The link check sends it to RPC before the anchors are looked at
            expect(await checkDiffs(block, 'reject')).toMatchObject({reason: 'verify'})
        })
    })

    it('leave the system-fee rule out when the dumper takes no state diffs', async () => {
        expect(await check(loadAnchoredBlock(), 'reject', ['status', 'gas', 'system-fee'])).toBeUndefined()
    })

    it('need receipts and call frames', () => {
        expect(() =>
            createLineVerifier(testChainUtils, {withTraces: true, consensusAnchorValidation: 'reject'}),
        ).toThrow('consensus anchor validation needs receipts and debug call frames')
        expect(() =>
            createLineVerifier(testChainUtils, {withReceipts: true, consensusAnchorValidation: 'observe'}),
        ).toThrow('consensus anchor validation needs receipts and debug call frames')
    })

    it('are not checked in a genesis block', async () => {
        let verifyLine = createLineVerifier(testChainUtils, {
            withReceipts: true,
            withTraces: true,
            consensusAnchorValidation: 'reject',
        })
        let genesis = makeBlock(0)
        genesis.logs_ = undefined
        expect(await verifyLine(genesis, linkOf(genesis))).toBeUndefined()
    })
})
