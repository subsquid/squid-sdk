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

        it('falls back to per-transaction receipts when eth_getBlockReceipts response is too big', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)
            const fixtureReceipts = loadReceipts('ethereum', 18000000)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), true], fixtureBlock)
            mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
            mockClient.setFixture(
                'eth_getBlockReceipts',
                [toQty(18000000)],
                {error: {code: -32008, message: 'Response is too big'}}
            )
            for (let receipt of fixtureReceipts) {
                mockClient.setFixture('eth_getTransactionReceipt', [receipt.transactionHash], receipt)
            }

            const rpc = new Rpc({ client: mockClient as any })

            const blocks = await rpc.getBlockBatch([18000000], { receipts: true, transactions: true })
            expect(blocks).toHaveLength(1)
            expect(blocks[0].receipts).toEqual(fixtureReceipts)
        })

        it('fixes invalid receipt logIndex values returned by RPC', async () => {
            const fixtureBlock = loadBlock('stable-testnet', 42767022)
            const fixtureReceipts = loadReceipts('stable-testnet', 42767022)
            expect(fixtureReceipts.flatMap(r => r.logs).map(log => log.logIndex)).toEqual([
                '0x0',
                '0x1',
                '0x2',
                '0x3',
                '0x0',
            ])

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x899')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(42767022), true], fixtureBlock)
            mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
            mockClient.setFixture('eth_getBlockReceipts', [toQty(42767022)], fixtureReceipts)

            const rpc = new Rpc({ client: mockClient as any, checkLogIndex: true })

            const blocks = await rpc.getBlockBatch([42767022], { receipts: true, transactions: true })
            expect(blocks).toHaveLength(1)

            const logs = blocks[0].receipts!.flatMap(r => r.logs)
            expect(logs.map(log => log.logIndex)).toEqual(['0x0', '0x1', '0x2', '0x3', '0x4'])
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

        it('exposes Avalanche block header fields', async () => {
            const fixtureBlock = loadBlock('avalanche-testnet', 58119344)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0xa869')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(58119344), true], fixtureBlock)

            const rpc = new Rpc({ client: mockClient as any })

            const blocks = await rpc.getBlockBatch([58119344], { transactions: true })
            expect(blocks).toBeTruthy()
            expect(blocks.length).toEqual(1)
            const block = blocks[0].block
            expect(block.targetExponent).toEqual('0xf0a451')
            expect(block.minPriceExponent).toEqual('0xd49a784bcd1b8b0')
            expect(block.settledHeight).toEqual('0x376d4ae')
            expect(block.settledGasUnix).toEqual('0x6a971370')
            expect(block.settledGasNumerator).toEqual('0x83720')
            expect(block.settledExcess).toEqual('0x131b81f7')
            expect(block.blockExtraData).toEqual('0x')
            expect(block.extDataHash).toEqual('0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421')
            expect(block.minDelayExcess).toEqual('0x6cd69c')
            expect(block.timestampMilliseconds).toEqual('0x1a05e240f88')
            expect(block.blockGasCost).toEqual('0x0')
            expect(block.extDataGasUsed).toEqual('0x0')
        })

        it('verifies extData hash for Avalanche blocks', async () => {
            const fixtureBlock = loadBlock('avalanche-testnet', 58119344)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0xa869')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(58119344), true], fixtureBlock)

            const rpc = new Rpc({client: mockClient as any, verifyExtDataHash: true})

            const blocks = await rpc.getBlockBatch([58119344], {transactions: true})
            expect(blocks).toBeTruthy()
            expect(blocks[0].block.blockExtraData).toEqual(fixtureBlock.blockExtraData)
        })

        it('detects tampered blockExtraData', async () => {
            const fixtureBlock = loadBlock('avalanche-testnet', 58119344)
            const tampered = {...fixtureBlock, blockExtraData: '0xdeadbeef'}

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0xa869')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(58119344), true], tampered)

            const rpc = new Rpc({client: mockClient as any, verifyExtDataHash: true})

            await expect(rpc.getBlockBatch([58119344], {transactions: true}))
                .rejects.toThrow('failed to verify extData hash')
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
