import {describe, expect, it} from 'vitest'
import {matchComponents} from '@subsquid/util-internal-dump-stream'
import {findUnverifiedParts, getComponentsRule} from './components'

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
    })

    it('requires the API of a part only when the dumper takes the part', () => {
        let without = getComponentsRule({useTraceApi: true, useDebugApiForStatediffs: true})
        expect(matchComponents('logs', without)).toBe(true)
        expect(matchComponents('logs,trace-api,debug-statediffs', without)).toBe(true)

        let traces = getComponentsRule({withTraces: true, useTraceApi: true})
        expect(matchComponents('logs,traces,trace-api', traces)).toBe(true)
        expect(matchComponents('logs,traces', traces)).toBe(false)
    })

    it('takes a block whatever checks the publisher has made or skipped', () => {
        let rule = getComponentsRule({
            verifyBlockHash: true,
            verifyTxRoot: true,
            callFrameValidation: 'reject',
        })

        for (let tag of [
            'logs',
            'logs,v-block-hash',
            'logs,no-log-index-check,no-cumulative-gas-check',
            'logs,v-state-root,no-new-check',
            'logs,gas-used-receipts-root',
        ]) {
            expect(matchComponents(tag, rule)).toBe(true)
        }
    })

    it('rejects a name it does not know', () => {
        let rule = getComponentsRule({})

        for (let tag of ['logs,blobs', 'logs,LOGS', 'logs,V-TX-ROOT', 'logs,v-', 'logs,no-', 'logs,v-tx--root']) {
            expect(matchComponents(tag, rule)).toBe(false)
        }
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
        expect(matchComponents('logs,v-tx-root,v-tx-root', rule)).toBe(false)
    })
})

describe('unverified parts', () => {
    it('names nothing when a root covers every set', () => {
        expect(findUnverifiedParts({withReceipts: true, verifyTxRoot: true, verifyReceiptsRoot: true})).toEqual([])
    })

    it('names each set by the options that would tie it to the header', () => {
        expect(findUnverifiedParts({})).toEqual([
            'transactions (--verify-tx-root)',
            'logs (--with-receipts --verify-receipts-root)',
        ])

        expect(findUnverifiedParts({withReceipts: true})).toEqual([
            'transactions (--verify-tx-root)',
            'receipts and logs (--verify-receipts-root)',
        ])
    })

    it('does not take a logs bloom for a verification of logs', () => {
        expect(findUnverifiedParts({verifyTxRoot: true, verifyLogsBloom: true})).toEqual([
            'logs (--with-receipts --verify-receipts-root)',
        ])
    })
})
