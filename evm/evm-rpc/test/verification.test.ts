import {it, describe} from 'node:test'
import assert from 'assert'
import {loadBlock, loadReceipts, hasReceipts, listFixtures, getChainId} from './helpers/fixture-loader'
import {blockHash} from '../src/verification'
import {ChainUtils} from '../src/chain-utils'
import {Transaction} from '../src/rpc-data'


describe('Verification Functions', () => {
    for (const fixture of listFixtures()) {
        describe(`${fixture.chain} block ${fixture.blockNumber}`, () => {
            it('blockHash verification', async () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                const computed = await blockHash(block)
                assert.equal(computed, block.hash, `Block hash mismatch for ${fixture.name}`)
            })

            it('transactionsRoot verification', async () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                if (!block.transactions || block.transactions.length === 0) return

                const chainId = getChainId(fixture.chain)
                const utils = new ChainUtils(chainId)
                const computed = await utils.calculateTransactionsRoot(block)
                assert.equal(computed, block.transactionsRoot, `Transactions root mismatch for ${fixture.name}`)
            })

            if (hasReceipts(fixture.chain, fixture.blockNumber)) {
                it('receiptsRoot verification', async () => {
                    const block = loadBlock(fixture.chain, fixture.blockNumber)
                    const receipts = loadReceipts(fixture.chain, fixture.blockNumber)
                    const chainId = getChainId(fixture.chain)
                    const utils = new ChainUtils(chainId)
                    const computed = await utils.calculateReceiptsRoot(block, receipts)
                    assert.equal(computed, block.receiptsRoot, `Receipts root mismatch for ${fixture.name}`)
                })

                it('logsBloom verification', async () => {
                    const block = loadBlock(fixture.chain, fixture.blockNumber)
                    const receipts = loadReceipts(fixture.chain, fixture.blockNumber)
                    const logs = receipts.flatMap(r => r.logs || [])
                    const chainId = getChainId(fixture.chain)
                    const utils = new ChainUtils(chainId)
                    const computed = utils.calculateLogsBloom(block, logs)
                    assert.equal(computed, block.logsBloom, `Logs bloom mismatch for ${fixture.name}`)
                })
            }

            it('transaction sender recovery', async () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                if (!block.transactions || block.transactions.length === 0) return
                if (typeof block.transactions[0] === 'string') return

                const chainId = getChainId(fixture.chain)
                const utils = new ChainUtils(chainId)
                const txs = block.transactions as Transaction[]

                for (const tx of txs) {
                    if (tx.type === '0x7f') continue
                    if (chainId === '0x3e7' && tx.gasPrice === '0x0') continue

                    const recovered = utils.recoverTxSender(tx)
                    if (recovered) {
                        assert.equal(
                            recovered.toLowerCase(),
                            tx.from.toLowerCase(),
                            `Sender mismatch for tx ${tx.hash} in ${fixture.name}`
                        )
                    }
                }
            })
        })
    }
})
