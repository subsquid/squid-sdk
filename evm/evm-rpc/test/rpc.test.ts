import { describe, it, expect } from 'vitest'
import { loadBlock, loadReceipts } from './helpers/fixture-loader'
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

    })

})
