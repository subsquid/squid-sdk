import { describe, it, expect } from 'vitest'
import { getChainId, loadBlock, loadReceipts } from './helpers/fixture-loader'
import { MockRpcClient } from './helpers/mock-rpc-client'
import { Rpc } from '../src/rpc'
import { toQty } from '../src/util'


describe('Rpc Class Integration', () => {
    describe('Block retrieval', () => {
        it('getBlockBatch returns blocks with transactions', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), true], fixtureBlock)

            const rpc = new Rpc({ client: mockClient as any })

            const blocks = await rpc.getBlockBatch([18000000], { transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
            expect(blocks[0].block).toBeTruthy()
            expect(blocks[0].block.number).toEqual(fixtureBlock.number)
        })

        it('getBlockBatch without transactions returns blocks with tx hashes only', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)
            const blockWithoutTxs = { ...fixtureBlock, transactions: fixtureBlock.transactions?.map((tx: any) => tx.hash) }

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), false], blockWithoutTxs)

            const rpc = new Rpc({ client: mockClient as any })

            const blocks = await rpc.getBlockBatch([18000000])
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
        })

        it('getBlockBatch handles missing blocks', async () => {
            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(99999999), true], null)

            const rpc = new Rpc({ client: mockClient as any })

            const blocks = await rpc.getBlockBatch([99999999], { transactions: true })
            expect(blocks.length).toEqual(0)
        })
    })

    describe('Receipt retrieval', () => {
        it('retrieves receipts via getBlockBatch with receipts request', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)
            const fixtureReceipts = loadReceipts('ethereum', 18000000)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), true], fixtureBlock)
            mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
            mockClient.setFixture('eth_getBlockReceipts', [toQty(18000000)], fixtureReceipts)

            const rpc = new Rpc({ client: mockClient as any })

            const blocks = await rpc.getBlockBatch([18000000], { receipts: true, transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
            expect(blocks[0].receipts).toBeTruthy()
            expect(blocks[0].receipts!.length).toBeGreaterThan(0)
        })
    })

    describe('Verification integration', () => {
        it('verifies block hash when enabled', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), true], fixtureBlock)

            const rpc = new Rpc({
                client: mockClient as any,
                verifyBlockHash: true
            })

            const blocks = await rpc.getBlockBatch([18000000], { transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
        })

        it('verifies transactions root when enabled', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), true], fixtureBlock)

            const rpc = new Rpc({
                client: mockClient as any,
                verifyTxRoot: true
            })

            const blocks = await rpc.getBlockBatch([18000000], { transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
        })

        it('detects invalid block hash', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)
            const tamperedBlock = { ...fixtureBlock, hash: '0x0000000000000000000000000000000000000000000000000000000000000000' }

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), true], tamperedBlock)

            const rpc = new Rpc({
                client: mockClient as any,
                verifyBlockHash: true
            })

            await expect(
                rpc.getBlockBatch([18000000], { transactions: true })
            ).rejects.toThrow()
        })
    })

    describe('Chain-specific behavior', () => {
        it('handles Polygon state-sync transactions correctly', async () => {
            const fixtureBlock = loadBlock('polygon', 50000000)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x89')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(50000000), true], fixtureBlock)

            const rpc = new Rpc({
                client: mockClient as any,
                verifyTxRoot: true
            })

            const blocks = await rpc.getBlockBatch([50000000], { transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
        })

        it('handles Arbitrum transaction types correctly', async () => {
            const fixtureBlock = loadBlock('arbitrum', 150000000)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0xa4b1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(150000000), true], fixtureBlock)

            const rpc = new Rpc({
                client: mockClient as any,
                verifyTxRoot: true
            })

            const blocks = await rpc.getBlockBatch([150000000], { transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
        })

        it('handles Hyperliquid system transactions correctly', async () => {
            const fixtureBlock = loadBlock('hyperliquid', 50000)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x3e7')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(50000), true], fixtureBlock)

            const rpc = new Rpc({
                client: mockClient as any,
                verifyTxRoot: true
            })

            const blocks = await rpc.getBlockBatch([50000], { transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
        })

        it('handles Tempo native transactions correctly', async () => {
            const fixtureBlock = loadBlock('tempoModerato', 6000178)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0xa5bf')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(6000178), true], fixtureBlock)

            const rpc = new Rpc({
                client: mockClient as any,
                verifyTxRoot: true
            })

            const blocks = await rpc.getBlockBatch([6000178], { transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
        })

        describe('Cronos phantom transaction stripping', () => {
            // Cronos (Ethermint) blocks may contain "phantom transactions" — txs that
            // were included by CometBFT but failed during EVM execution and never got
            // receipts. See stripPhantomTransactions() in rpc.ts for details.

            it('strips phantom transaction from block 0x198d (all txs phantom)', async () => {
                const fixtureBlock = loadBlock('cronos', 6541)
                const fixtureReceipts = loadReceipts('cronos', 6541)
                expect(fixtureBlock.transactions.length).toEqual(1)
                expect(fixtureReceipts.length).toEqual(0)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(6541), true], fixtureBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(6541)], fixtureReceipts)
                // Nonce check: sender nonce at block = 0x3, same as tx nonce (confirms tx is phantom)
                mockClient.setFixture('eth_getTransactionCount', ['0xf4ec980a7e076c19317ffde70f7c63ce8112204a', '0x198d'], '0x3')

                const rpc = new Rpc({ client: mockClient as any })

                const blocks = await rpc.getBlockBatch([6541], { receipts: true, transactions: true })
                expect(blocks).toHaveLength(1)
                expect(blocks[0].block.transactions).toEqual([])
                expect(blocks[0].receipts).toEqual([])
            })

            it('strips phantom transaction from block 0x20189 and renumbers indices', async () => {
                const fixtureBlock = loadBlock('cronos', 131465)
                const fixtureReceipts = loadReceipts('cronos', 131465)
                expect(fixtureBlock.transactions.length).toEqual(3)
                expect(fixtureReceipts.length).toEqual(2)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(131465), true], fixtureBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(131465)], fixtureReceipts)
                // Nonce check: sender nonce at block = 0x73, same as tx nonce (confirms tx is phantom)
                mockClient.setFixture('eth_getTransactionCount', ['0x3c5937f277ac77bc1631b6865d8466cebb627a84', '0x20189'], '0x73')

                const rpc = new Rpc({ client: mockClient as any })

                const blocks = await rpc.getBlockBatch([131465], { receipts: true, transactions: true })
                expect(blocks).toHaveLength(1)

                const block = blocks[0]

                // Phantom tx stripped — 2 transactions remain
                expect(block.block.transactions.length).toEqual(2)
                expect(block.receipts?.length).toEqual(2)

                // Transaction hashes match (phantom 0xd7c874.. removed)
                const txHashes = block.block.transactions.map((tx: any) => tx.hash)
                expect(txHashes).toEqual([
                    '0x4de47bed62b436744397ae2259352e57b7168836ea6a43e33928be37ca1b417f',
                    '0x672fbc93a4fd96284405b042b93bddb42d4d38bfb79d0baac776f1cb4962d982',
                ])

                // Transaction indices renumbered to be contiguous
                expect((block.block.transactions[0] as any).transactionIndex).toEqual('0x0')
                expect((block.block.transactions[1] as any).transactionIndex).toEqual('0x1')

                // Receipt indices renumbered to match
                expect(block.receipts![0].transactionIndex).toEqual('0x0')
                expect(block.receipts![1].transactionIndex).toEqual('0x1')

                // Receipts match their transactions by hash
                expect(block.receipts![0].transactionHash).toEqual(txHashes[0])
                expect(block.receipts![1].transactionHash).toEqual(txHashes[1])

                // Log transactionIndex values are consistent with their receipt
                for (const receipt of block.receipts!) {
                    for (const log of receipt.logs) {
                        expect(log.transactionIndex).toEqual(receipt.transactionIndex)
                    }
                }
            })

            it('does not strip transactions from normal Cronos blocks', async () => {
                const fixtureBlock = loadBlock('cronos', 10000)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(10000), true], fixtureBlock)

                const rpc = new Rpc({ client: mockClient as any })

                const blocks = await rpc.getBlockBatch([10000], { transactions: true })
                expect(blocks).toHaveLength(1)
                expect(blocks[0].block.transactions.length).toBeGreaterThan(0)
                expect(blocks[0].block.transactions.length).toEqual(fixtureBlock.transactions.length)
            })

            it('handles mixed batch (blocks 6541-6542)', async () => {
                const brokenBlock = loadBlock('cronos', 6541)
                const brokenReceipts = loadReceipts('cronos', 6541)
                const normalBlock = loadBlock('cronos', 6542)
                const normalReceipts = loadReceipts('cronos', 6542)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(6541), true], brokenBlock)
                mockClient.setFixture('eth_getBlockByNumber', [toQty(6542), true], normalBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], normalReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(6541)], brokenReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(6542)], normalReceipts)
                mockClient.setFixture('eth_getTransactionCount', ['0xf4ec980a7e076c19317ffde70f7c63ce8112204a', '0x198d'], '0x3')

                const rpc = new Rpc({ client: mockClient as any })

                const blocks = await rpc.getBlockBatch([6541, 6542], { receipts: true, transactions: true })
                expect(blocks).toHaveLength(2)

                // Block 6541: phantom tx stripped
                expect(blocks[0].number).toEqual(6541)
                expect(blocks[0].block.transactions).toEqual([])
                expect(blocks[0].receipts).toEqual([])

                // Block 6542: normal processing
                expect(blocks[1].number).toEqual(6542)
                expect(blocks[1].block.transactions.length).toEqual(normalBlock.transactions.length)
                expect(blocks[1].receipts?.length).toEqual(normalBlock.transactions.length)
            })
        })

        it('handles Frontier EIP-7702 transactions correctly', async () => {
            const fixtureBlock = loadBlock('bittensor-testnet', 6646068)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x3b1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(6646068), true], fixtureBlock)

            const rpc = new Rpc({
                client: mockClient as any,
                verifyTxRoot: true
            })

            const blocks = await rpc.getBlockBatch([6646068], { transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
        })
    })

})
