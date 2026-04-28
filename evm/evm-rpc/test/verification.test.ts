import {assertNotNull} from '@subsquid/util-internal'
import {describe, it, expect} from 'vitest'
import {loadBlock, loadReceipts, loadAllReceipts, hasReceipts, listFixtures, getChainId} from './helpers/fixture-loader'
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

            it.skipIf(
                // Cosmos/Tendermint EVM chains use SHA-256 Merkle trees, not Keccak-256
                fixture.chain === 'stable' ||
                fixture.chain === 'bittensor-testnet' ||
                fixture.chain === 'cronos'
            )('blockHash verification', async () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                const chainId = getChainId(fixture.chain)
                const utils = new ChainUtils(chainId)
                const computed = await utils.calculateBlockHash(block)
                expect(computed).toEqual(block.hash)
            })

            it.skipIf(
                // Cosmos/Tendermint EVM chains use a different algorithm for the transactions root
                fixture.chain === 'cronos'
            )('transactionsRoot verification', async () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                if (!block.transactions || block.transactions.length === 0) return

                const chainId = getChainId(fixture.chain)
                const utils = new ChainUtils(chainId)
                const computed = await utils.calculateTransactionsRoot(block)
                expect(computed).toEqual(block.transactionsRoot)
            })

            if (hasReceipts(fixture.chain, fixture.blockNumber)) {
                it.skipIf(
                    // Cosmos/Tendermint EVM chains usually use a different algorithm for the receipts root
                    fixture.chain === 'cronos'
                )('receiptsRoot verification', async () => {
                    const block = loadBlock(fixture.chain, fixture.blockNumber)
                    const receipts = loadReceipts(fixture.chain, fixture.blockNumber)
                    const chainId = getChainId(fixture.chain)
                    const utils = new ChainUtils(chainId)
                    const computed = await utils.calculateReceiptsRoot(block, receipts)
                    expect(computed).toEqual(block.receiptsRoot)
                })

                it.skipIf(
                    // Cronos block 11446765 has leaked logs from a reverted
                    // transaction — its header bloom cannot be reconstructed
                    // from the receipt logs alone. Handled by the trace-based
                    // verification path in the Rpc class, covered in rpc.test.ts.
                    fixture.chain === 'cronos' && fixture.blockNumber === 11446765
                )('logsBloom verification', async () => {
                    const block = loadBlock(fixture.chain, fixture.blockNumber)
                    // Use loadAllReceipts so that Cronos blocks with recovered
                    // receipts (tx-*-receipt.json) are tested against the full
                    // receipt set rather than just eth_getBlockReceipts output.
                    const receipts = loadAllReceipts(fixture.chain, fixture.blockNumber)
                    const logs = receipts.flatMap(r => r.logs || [])
                    const chainId = getChainId(fixture.chain)
                    const utils = new ChainUtils(chainId)
                    const computed = utils.calculateLogsBloom(block, logs)
                    expect(computed).toEqual(block.logsBloom)
                })
            }

            it('withdrawalsRoot verification', async () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                if (block.withdrawalsRoot == null) return

                const chainId = getChainId(fixture.chain)
                const utils = new ChainUtils(chainId)
                const withdrawals = assertNotNull(block.withdrawals)
                const computed = await utils.calculateWithdrawalsRoot(withdrawals)
                expect(computed).toEqual(block.withdrawalsRoot)
            })

            it('transaction sender recovery', async () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                if (!block.transactions || block.transactions.length === 0) return
                if (typeof block.transactions[0] === 'string') return

                const chainId = getChainId(fixture.chain)
                const utils = new ChainUtils(chainId)
                const txs = block.transactions as Transaction[]

                for (const tx of txs) {
                    if (tx.type === '0x7f') continue

                    const recovered = utils.recoverTxSender(tx)
                    if (recovered) {
                        expect(recovered.toLowerCase()).toEqual(tx.from.toLowerCase())
                    }
                }
            })
        })
    }
})
