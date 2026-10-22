import {assertNotNull} from '@subsquid/util-internal'
import {describe, it, expect} from 'vitest'
import {
    loadBlock,
    loadReceipts,
    loadAllReceipts,
    hasReceipts,
    loadBlockAccessList,
    hasBlockAccessList,
    listFixtures,
    getChainId
} from './helpers/fixture-loader'
import {ChainUtils} from '../src/chain-utils'
import {BlockAccessList, GetBlock, Transaction} from '../src/rpc-data'


function hasTransactionType(chain: string, blockNumber: number, type: string): boolean {
    return loadBlock(chain, blockNumber).transactions.some(tx => typeof tx != 'string' && tx.type == type)
}


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
                fixture.chain === 'stable-testnet' ||
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
                fixture.chain === 'cronos' ||
                // Scroll L1 messages (type 0x7e) are not OP deposits; their encoding is not implemented
                (fixture.chain === 'scroll' && hasTransactionType(fixture.chain, fixture.blockNumber, '0x7e'))
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

            it.skipIf(
                // OP-stack chains store the root of the L2-to-L1 message tree in
                // withdrawalsRoot, while the JSON-RPC `withdrawals` list stays
                // empty - the root cannot be recomputed from the list.
                fixture.chain === 'base-mainnet'
            )('withdrawalsRoot verification', async () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                if (block.withdrawalsRoot == null) return

                const chainId = getChainId(fixture.chain)
                const utils = new ChainUtils(chainId)
                const withdrawals = assertNotNull(block.withdrawals)
                const computed = await utils.calculateWithdrawalsRoot(withdrawals)
                expect(computed).toEqual(block.withdrawalsRoot)
            })

            if (hasBlockAccessList(fixture.chain, fixture.blockNumber)) {
                it('blockAccessListHash verification', () => {
                    const block = loadBlock(fixture.chain, fixture.blockNumber)
                    const accessList = loadBlockAccessList(fixture.chain, fixture.blockNumber)
                    expect(BlockAccessList.validate(accessList)).toBeUndefined()
                    const utils = new ChainUtils(getChainId(fixture.chain))
                    expect(utils.calculateBlockAccessListHash(accessList)).toEqual(block.blockAccessListHash)
                })
            }

            it('extData verification', () => {
                const block = loadBlock(fixture.chain, fixture.blockNumber)
                if (block.extDataHash == null) return // non-Avalanche fixtures
                const utils = new ChainUtils(getChainId(fixture.chain))
                expect(block.extDataHash).toEqual(utils.calculateExtDataHash(block))
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


// Sepolia block 11856337 is the first Amsterdam (Glamsterdam) block: its
// header carries blockAccessListHash (EIP-7928) and slotNumber (EIP-7843).
describe('Amsterdam header commitments', () => {
    const utils = new ChainUtils(getChainId('ethereum-sepolia'))

    it('a forged slotNumber fails the block hash', () => {
        const block = loadBlock('ethereum-sepolia', 11856337)
        expect(block.slotNumber).toBeDefined()
        const forged = {...block, slotNumber: `0x${(BigInt(block.slotNumber!) + 1n).toString(16)}`}
        expect(utils.calculateBlockHash(forged)).not.toEqual(block.hash)
    })

    it('a forged blockAccessListHash fails the block hash', () => {
        const block = loadBlock('ethereum-sepolia', 11856337)
        const forged = {...block, blockAccessListHash: `0x${'00'.repeat(32)}`}
        expect(utils.calculateBlockHash(forged)).not.toEqual(block.hash)
    })

    it('a forged storage write fails the block access list hash', () => {
        const block = loadBlock('ethereum-sepolia', 11856337)
        const accessList = loadBlockAccessList('ethereum-sepolia', 11856337)
        const account = accessList.find(a => a.storageChanges.length > 0)!
        const change = account.storageChanges[0].changes[0]
        change.value = `0x${(BigInt(change.value) + 1n).toString(16)}`
        expect(utils.calculateBlockAccessListHash(accessList)).not.toEqual(block.blockAccessListHash)
    })

    it('a dropped storage read fails the block access list hash', () => {
        const block = loadBlock('ethereum-sepolia', 11856337)
        const accessList = loadBlockAccessList('ethereum-sepolia', 11856337)
        const account = accessList.find(a => a.storageReads.length > 0)!
        account.storageReads.pop()
        expect(utils.calculateBlockAccessListHash(accessList)).not.toEqual(block.blockAccessListHash)
    })

    it('an access list missing a change kind fails the schema', () => {
        const accessList: any[] = loadBlockAccessList('ethereum-sepolia', 11856337)
        const {storageReads, ...withoutReads} = accessList[0]
        accessList[0] = withoutReads
        expect(BlockAccessList.validate(accessList)).toBeDefined()
    })

    it('an empty access list hashes to keccak256(rlp([]))', () => {
        expect(utils.calculateBlockAccessListHash([])).toEqual(
            '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347'
        )
    })
})
