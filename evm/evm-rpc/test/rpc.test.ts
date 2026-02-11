import {it, describe} from 'node:test'
import assert from 'assert'
import {loadBlock, loadReceipts} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'
import {Rpc} from '../src/rpc'
import {toQty} from '../src/util'


describe('Rpc Class Integration', () => {
    describe('Block retrieval', () => {
        it('getBlockBatch returns blocks with transactions', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), true], fixtureBlock)

            const rpc = new Rpc({client: mockClient as any})

            const blocks = await rpc.getBlockBatch([18000000], {transactions: true})
            assert.ok(blocks, 'Blocks should be returned')
            assert.equal(blocks.length, 1)
            assert.ok(blocks[0].block, 'Block should have block property')
            assert.equal(blocks[0].block.number, fixtureBlock.number)
        })

        it('getBlockBatch without transactions returns blocks with tx hashes only', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)
            const blockWithoutTxs = {...fixtureBlock, transactions: fixtureBlock.transactions?.map((tx: any) => tx.hash)}

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), false], blockWithoutTxs)

            const rpc = new Rpc({client: mockClient as any})

            const blocks = await rpc.getBlockBatch([18000000])
            assert.ok(blocks, 'Blocks should be returned')
            assert.equal(blocks.length, 1)
        })

        it('getBlockBatch handles missing blocks', async () => {
            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(99999999), true], null)

            const rpc = new Rpc({client: mockClient as any})

            const blocks = await rpc.getBlockBatch([99999999], {transactions: true})
            assert.equal(blocks.length, 0, 'Missing blocks should be filtered out')
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

            const rpc = new Rpc({client: mockClient as any})

            const blocks = await rpc.getBlockBatch([18000000], {receipts: true, transactions: true})
            assert.ok(blocks, 'Blocks should be returned')
            assert.equal(blocks.length, 1)
            assert.ok(blocks[0].receipts, 'Block should have receipts attached')
            assert.ok(blocks[0].receipts!.length > 0, 'Receipts should not be empty')
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

            const blocks = await rpc.getBlockBatch([18000000], {transactions: true})
            assert.ok(blocks, 'Blocks should be returned after verification')
            assert.equal(blocks.length, 1)
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

            const blocks = await rpc.getBlockBatch([18000000], {transactions: true})
            assert.ok(blocks, 'Blocks should be returned after tx root verification')
            assert.equal(blocks.length, 1)
        })

        it('detects invalid block hash', async () => {
            const fixtureBlock = loadBlock('ethereum', 18000000)
            const tamperedBlock = {...fixtureBlock, hash: '0x0000000000000000000000000000000000000000000000000000000000000000'}

            const mockClient = new MockRpcClient()
            mockClient.setFixture('eth_chainId', undefined, '0x1')
            mockClient.setFixture('eth_getBlockByNumber', [toQty(18000000), true], tamperedBlock)

            const rpc = new Rpc({
                client: mockClient as any,
                verifyBlockHash: true
            })

            await assert.rejects(
                () => rpc.getBlockBatch([18000000], {transactions: true}),
                (error: any) => {
                    assert.ok(
                        error.message.includes('failed to verify') || error.message.includes('hash'),
                        'Error should be about hash verification'
                    )
                    return true
                }
            )
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

            const blocks = await rpc.getBlockBatch([50000000], {transactions: true})
            assert.ok(blocks, 'Blocks should be returned')
            assert.equal(blocks.length, 1)
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

            const blocks = await rpc.getBlockBatch([150000000], {transactions: true})
            assert.ok(blocks, 'Blocks should be returned')
            assert.equal(blocks.length, 1)
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

            const blocks = await rpc.getBlockBatch([50000], {transactions: true})
            assert.ok(blocks, 'Blocks should be returned')
            assert.equal(blocks.length, 1)
        })
    })
})
