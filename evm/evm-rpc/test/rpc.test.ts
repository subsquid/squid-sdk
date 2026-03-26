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

        describe('Cronos block 0x198d workaround', () => {
            // See description of the issue in evm/evm-rpc/src/rpc.ts (inside `mapBlock`)

            it('strips phantom transaction from Cronos block 0x198d', async () => {
                const fixtureBlock = loadBlock('cronos', 6541)
                // The original block has 1 transaction
                expect(fixtureBlock.transactions.length).toEqual(1)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(6541), true], fixtureBlock)

                const rpc = new Rpc({ client: mockClient as any })

                const blocks = await rpc.getBlockBatch([6541], { transactions: true })
                expect(blocks).toHaveLength(1)
                // The transaction is stripped — block appears empty
                expect(blocks[0].block.transactions).toEqual([])
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
                const normalBlock = loadBlock('cronos', 6542)
                const normalReceipts = loadReceipts('cronos', 6542)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(6541), true], brokenBlock)
                mockClient.setFixture('eth_getBlockByNumber', [toQty(6542), true], normalBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], normalReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(6542)], normalReceipts)

                const rpc = new Rpc({ client: mockClient as any })

                const blocks = await rpc.getBlockBatch([6541, 6542], { receipts: true, transactions: true })
                expect(blocks).toHaveLength(2)

                // block 6541: phantom tx stripped, no receipts
                expect(blocks[0].number).toEqual(6541)
                expect(blocks[0].block.transactions).toEqual([])
                expect(blocks[0].receipts).toBe(undefined)

                // block 6542: normal processing
                expect(blocks[1].number).toEqual(6542)
                expect(blocks[1].block.transactions.length).toBeGreaterThan(0)
                expect(blocks[1].block.transactions.length).toEqual(normalBlock.transactions.length)
                expect(blocks[1].receipts?.length).toEqual(normalBlock.transactions.length)
            })

            it('does not apply workaround on non-Cronos chains for block 6541', async () => {
                const fixtureBlock = loadBlock('tempoModerato', 6541)
                const fixtureReceipts = loadReceipts('tempoModerato', 6541)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, getChainId('tempoModerato'))
                mockClient.setFixture('eth_getBlockByNumber', [toQty(6541), true], fixtureBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(6541)], fixtureReceipts)

                const rpc = new Rpc({ client: mockClient as any })

                const blocks = await rpc.getBlockBatch([6541], { receipts: true, transactions: true })
                expect(blocks).toHaveLength(1)
                expect(blocks[0].number).toEqual(6541)
                expect(blocks[0].block.transactions.length).toBeGreaterThan(0)
                expect(blocks[0].block.transactions.length).toEqual(fixtureBlock.transactions.length)
                expect(blocks[0].receipts?.length).toEqual(fixtureBlock.transactions.length)
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
