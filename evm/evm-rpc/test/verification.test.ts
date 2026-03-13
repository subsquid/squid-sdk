import {describe, it, expect} from 'vitest'
import {loadBlock, loadReceipts, hasReceipts, listFixtures, getChainId} from './helpers/fixture-loader'
import {ChainUtils} from '../src/chain-utils'
import {GetBlock, Transaction} from '../src/rpc-data'


describe('Verification Functions', () => {
    for (const fixture of listFixtures()) {
        describe(`${fixture.chain} block ${fixture.blockNumber}`, () => {
            it('schema validation', () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                const err = GetBlock.validate(block)
                expect(err).toBeUndefined()
            })

            it('blockHash verification', async () => {
                // Cosmos/Tendermint EVM chains use SHA-256 Merkle trees, not Keccak-256
                if (fixture.chain === 'stable') return
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                const chainId = getChainId(fixture.chain)
                const utils = new ChainUtils(chainId)
                const computed = await utils.calculateBlockHash(block)
                expect(computed).toEqual(block.hash)
            })

            it('transactionsRoot verification', async () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                if (!block.transactions || block.transactions.length === 0) return

                const chainId = getChainId(fixture.chain)
                const utils = new ChainUtils(chainId)
                const computed = await utils.calculateTransactionsRoot(block)
                expect(computed).toEqual(block.transactionsRoot)
            })

            if (hasReceipts(fixture.chain, fixture.blockNumber)) {
                it('receiptsRoot verification', async () => {
                    const block = loadBlock(fixture.chain, fixture.blockNumber)
                    const receipts = loadReceipts(fixture.chain, fixture.blockNumber)
                    const chainId = getChainId(fixture.chain)
                    const utils = new ChainUtils(chainId)
                    const computed = await utils.calculateReceiptsRoot(block, receipts)
                    expect(computed).toEqual(block.receiptsRoot)
                })

                it('logsBloom verification', async () => {
                    const block = loadBlock(fixture.chain, fixture.blockNumber)
                    const receipts = loadReceipts(fixture.chain, fixture.blockNumber)
                    const logs = receipts.flatMap(r => r.logs || [])
                    const chainId = getChainId(fixture.chain)
                    const utils = new ChainUtils(chainId)
                    const computed = utils.calculateLogsBloom(block, logs)
                    expect(computed).toEqual(block.logsBloom)
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
                    if (tx.r === '0x0' && tx.s === '0x0') continue // unsigned system txs (e.g. Stable)

                    const recovered = utils.recoverTxSender(tx)
                    if (recovered) {
                        expect(recovered.toLowerCase()).toEqual(tx.from.toLowerCase())
                    }
                }
            })
        })
    }
})
