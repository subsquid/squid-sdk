import {describe, expect, it} from 'vitest'
import {findUnverifiedParts, getComponentsRule, matchComponents} from './components'

describe('components rule', () => {
    it('takes logs when receipts are off and receipts when they are on', () => {
        let logs = getComponentsRule({})
        expect(matchComponents('logs', logs)).toBe(true)
        expect(matchComponents('receipts', logs)).toBe(false)
        expect(matchComponents('logs,receipts', logs)).toBe(false)
        expect(matchComponents('', logs)).toBe(false)

        let receipts = getComponentsRule({withReceipts: true})
        expect(matchComponents('receipts', receipts)).toBe(true)
        expect(matchComponents('logs', receipts)).toBe(false)
    })

    it('requires the data names to be exactly the selection of the dumper', () => {
        let rule = getComponentsRule({
            withReceipts: true,
            withTraces: true,
            withStatediffs: true,
            useDebugApiForStatediffs: true,
        })

        expect(matchComponents('receipts,traces,statediffs,debug-statediffs', rule)).toBe(true)
        expect(matchComponents('receipts,traces,statediffs', rule)).toBe(false)
        expect(matchComponents('receipts,traces,statediffs,trace-api,debug-statediffs', rule)).toBe(false)
        expect(matchComponents('receipts,traces', rule)).toBe(false)
    })

    it('rejects data the dumper has not asked for', () => {
        let rule = getComponentsRule({})
        expect(matchComponents('logs,traces', rule)).toBe(false)
        expect(matchComponents('logs,statediffs', rule)).toBe(false)
        expect(matchComponents('logs,trace-api', rule)).toBe(false)
    })

    it('requires every verification the dumper has on', () => {
        let rule = getComponentsRule({
            verifyBlockHash: true,
            verifyTxRoot: true,
            callFrameValidation: 'reject',
        })

        expect(matchComponents('logs,v-block-hash,v-tx-root,v-call-frames', rule)).toBe(true)
        expect(matchComponents('logs,v-block-hash,v-tx-root', rule)).toBe(false)
        expect(matchComponents('logs,v-tx-root,v-call-frames', rule)).toBe(false)
    })

    it('maps each verification option to its name', () => {
        let names: [option: string, name: string][] = [
            ['verifyBlockHash', 'v-block-hash'],
            ['verifyExtDataHash', 'v-ext-data-hash'],
            ['verifyTxSender', 'v-tx-sender'],
            ['verifyTxRoot', 'v-tx-root'],
            ['verifyReceiptsRoot', 'v-receipts-root'],
            ['verifyWithdrawalsRoot', 'v-withdrawals-root'],
            ['verifyLogsBloom', 'v-logs-bloom'],
        ]

        for (let [option, name] of names) {
            let rule = getComponentsRule({[option]: true})
            expect(rule.required).toEqual([name])
            expect(matchComponents('logs', rule)).toBe(false)
            expect(matchComponents(`logs,${name}`, rule)).toBe(true)
        }
    })

    it('does not require call frame validation in the observe mode', () => {
        let rule = getComponentsRule({callFrameValidation: 'observe'})
        expect(matchComponents('logs', rule)).toBe(true)
    })

    it('accepts verifications the dumper does not make', () => {
        let rule = getComponentsRule({})
        expect(matchComponents('logs,v-block-hash,v-logs-bloom', rule)).toBe(true)
    })

    it('rejects a skipped check unless the dumper skips it too', () => {
        let strict = getComponentsRule({})
        expect(matchComponents('logs,no-log-index-check', strict)).toBe(false)
        expect(matchComponents('logs,no-cumulative-gas-check', strict)).toBe(false)

        let relaxed = getComponentsRule({
            skipLogIndexCheck: true,
            skipCumulativeGasUsedCheck: true,
        })
        expect(matchComponents('logs,no-log-index-check,no-cumulative-gas-check', relaxed)).toBe(true)
        expect(matchComponents('logs', relaxed)).toBe(true)
    })

    it('requires the receipts root mode to be the same', () => {
        let cumulative = getComponentsRule({})
        expect(matchComponents('logs,gas-used-receipts-root', cumulative)).toBe(false)

        let gasUsed = getComponentsRule({useGasUsedForReceiptsRoot: true})
        expect(matchComponents('logs,gas-used-receipts-root', gasUsed)).toBe(true)
        expect(matchComponents('logs', gasUsed)).toBe(false)
    })

    it('rejects a name it does not know', () => {
        let rule = getComponentsRule({})
        expect(matchComponents('logs,blobs', rule)).toBe(false)
        expect(matchComponents('logs,v-state-root', rule)).toBe(false)
        expect(matchComponents('logs,LOGS', rule)).toBe(false)
    })

    it('rejects padded, empty and repeated names', () => {
        let rule = getComponentsRule({})

        // a padded name must not hide the receipts the dumper has not asked for
        expect(matchComponents('logs, receipts', rule)).toBe(false)
        expect(matchComponents(' logs', rule)).toBe(false)
        expect(matchComponents('logs ', rule)).toBe(false)
        expect(matchComponents('logs,', rule)).toBe(false)
        expect(matchComponents('logs,,v-tx-root', rule)).toBe(false)
        expect(matchComponents('logs,logs', rule)).toBe(false)
    })
})

describe('unverified parts', () => {
    it('names nothing when a root or a bloom covers every set', () => {
        expect(findUnverifiedParts({verifyTxRoot: true, verifyLogsBloom: true})).toEqual([])
        expect(findUnverifiedParts({withReceipts: true, verifyTxRoot: true, verifyReceiptsRoot: true})).toEqual([])
    })

    it('names each set by the option that would tie it to the header', () => {
        expect(findUnverifiedParts({})).toEqual(['transactions (--verify-tx-root)', 'logs (--verify-logs-bloom)'])
    })

    it('names receipts only when the dumper fetches them', () => {
        let options = {verifyTxRoot: true, verifyLogsBloom: true}

        expect(findUnverifiedParts(options)).toEqual([])
        expect(findUnverifiedParts({...options, withReceipts: true})).toEqual(['receipts (--verify-receipts-root)'])
    })
})
