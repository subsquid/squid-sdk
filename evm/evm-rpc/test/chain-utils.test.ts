import {it, describe} from 'node:test'
import assert from 'assert'
import {loadBlock, loadReceipts} from './helpers/fixture-loader'
import {ChainUtils} from '../src/chain-utils'


describe('Chain-Specific Utilities', () => {
    describe('Ethereum (standard chain)', () => {
        it('no special filtering for transactionsRoot', async () => {
            const block = loadBlock('ethereum', 18000000)
            const utils = new ChainUtils('0x1')
            const computed = await utils.calculateTransactionsRoot(block)
            assert.equal(computed, block.transactionsRoot)
        })

        it('no special filtering for receiptsRoot', async () => {
            const block = loadBlock('ethereum', 18000000)
            const receipts = loadReceipts('ethereum', 18000000)
            const utils = new ChainUtils('0x1')
            const computed = await utils.calculateReceiptsRoot(block, receipts)
            assert.equal(computed, block.receiptsRoot)
        })
    })

    describe('Polygon (state-sync filtering)', () => {
        it('filters state-sync txs from transactionsRoot', async () => {
            const block = loadBlock('polygon', 50000000)
            const utils = new ChainUtils('0x89')
            const computed = await utils.calculateTransactionsRoot(block)
            assert.equal(computed, block.transactionsRoot,
                'Transactions root should match after filtering state-sync txs')
        })

        it('filters state-sync receipts from receiptsRoot', async () => {
            const block = loadBlock('polygon', 50000000)
            const receipts = loadReceipts('polygon', 50000000)
            const utils = new ChainUtils('0x89')
            const computed = await utils.calculateReceiptsRoot(block, receipts)
            assert.equal(computed, block.receiptsRoot,
                'Receipts root should match after filtering state-sync receipts')
        })

        it('filters state-sync logs from logsBloom', async () => {
            const block = loadBlock('polygon', 50000000)
            const receipts = loadReceipts('polygon', 50000000)
            const logs = receipts.flatMap(r => r.logs || [])
            const utils = new ChainUtils('0x89')
            const computed = utils.calculateLogsBloom(block, logs)
            assert.equal(computed, block.logsBloom,
                'Logs bloom should match after filtering state-sync logs')
        })
    })

    describe('Arbitrum (special tx types)', () => {
        it('handles arbitrum tx types in transactionsRoot', async () => {
            const block = loadBlock('arbitrum', 150000000)
            const utils = new ChainUtils('0xa4b1')
            const computed = await utils.calculateTransactionsRoot(block)
            assert.equal(computed, block.transactionsRoot,
                'Transactions root should support Arbitrum tx types (0x64-0x6a)')
        })

        it('handles arbitrum receipts correctly', async () => {
            const block = loadBlock('arbitrum', 150000000)
            const receipts = loadReceipts('arbitrum', 150000000)
            const utils = new ChainUtils('0xa4b1')
            const computed = await utils.calculateReceiptsRoot(block, receipts)
            assert.equal(computed, block.receiptsRoot,
                'Receipts root should match for Arbitrum')
        })
    })

    describe('Hyperliquid EVM (system tx filtering)', () => {
        it('filters system txs from transactionsRoot', async () => {
            const block = loadBlock('hyperliquid', 50000)
            const utils = new ChainUtils('0x3e7')
            const computed = await utils.calculateTransactionsRoot(block)
            assert.equal(computed, block.transactionsRoot,
                'Transactions root should match after filtering system txs (gasPrice=0)')
        })

        it('filters system receipts from receiptsRoot', async () => {
            const block = loadBlock('hyperliquid', 50000)
            const receipts = loadReceipts('hyperliquid', 50000)
            const utils = new ChainUtils('0x3e7')
            const computed = await utils.calculateReceiptsRoot(block, receipts)
            assert.equal(computed, block.receiptsRoot,
                'Receipts root should match after filtering system receipts')
        })

        it('filters system logs from logsBloom', async () => {
            const block = loadBlock('hyperliquid', 50000)
            const receipts = loadReceipts('hyperliquid', 50000)
            const logs = receipts.flatMap(r => r.logs || [])
            const utils = new ChainUtils('0x3e7')
            const computed = utils.calculateLogsBloom(block, logs)
            assert.equal(computed, block.logsBloom,
                'Logs bloom should match after filtering system logs')
        })
    })
})
