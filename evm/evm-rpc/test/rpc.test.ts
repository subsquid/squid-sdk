import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as Path from 'path'
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

            it('strips phantom transaction with status=0x0 receipt from block 0x10a77', async () => {
                // Block 0x10a77 contains a phantom tx (0xc453d4..) that has a receipt
                // with status=0x0 and no logs, but its pre-revert logs leak into the
                // block's logsBloom. Nonce at block = tx.nonce, confirming phantom.
                // The same tx is re-included and succeeds in block 0x10a78.
                const fixtureBlock = loadBlock('cronos', 68215)
                const fixtureReceipts = loadReceipts('cronos', 68215)
                expect(fixtureBlock.transactions.length).toEqual(7)
                expect(fixtureReceipts.length).toEqual(7)
                expect(fixtureReceipts[6].status).toEqual('0x0')
                expect(fixtureReceipts[6].transactionHash).toEqual(
                    '0xc453d4a77cfaf344f76523b2edaf4e4ba949facb53423c6b6e78d03f3f5f05fe'
                )

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(68215), true], fixtureBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(68215)], fixtureReceipts)
                // Nonce at block = 0x36, same as tx nonce (confirms tx is phantom)
                mockClient.setFixture(
                    'eth_getTransactionCount',
                    ['0xd494d1276b7e84da2a502ab3dfc3440a0a241009', '0x10a77'],
                    '0x36'
                )

                const rpc = new Rpc({ client: mockClient as any })

                const blocks = await rpc.getBlockBatch([68215], { receipts: true, transactions: true })
                expect(blocks).toHaveLength(1)

                const block = blocks[0]

                // Phantom tx stripped — 6 transactions remain
                expect(block.block.transactions.length).toEqual(6)
                expect(block.receipts?.length).toEqual(6)

                // The phantom tx hash is gone
                const txHashes = (block.block.transactions as any[]).map(tx => tx.hash)
                expect(txHashes).not.toContain(
                    '0xc453d4a77cfaf344f76523b2edaf4e4ba949facb53423c6b6e78d03f3f5f05fe'
                )
                expect(block.receipts!.map(r => r.transactionHash)).not.toContain(
                    '0xc453d4a77cfaf344f76523b2edaf4e4ba949facb53423c6b6e78d03f3f5f05fe'
                )
            })

            it('strips phantom tx from block 0x10a77 even with logs bloom verification enabled', async () => {
                // After stripping the phantom tx, the bloom computed from the
                // remaining receipt logs equals the header logsBloom exactly.
                const fixtureBlock = loadBlock('cronos', 68215)
                const fixtureReceipts = loadReceipts('cronos', 68215)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(68215), true], fixtureBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(68215)], fixtureReceipts)
                mockClient.setFixture(
                    'eth_getTransactionCount',
                    ['0xd494d1276b7e84da2a502ab3dfc3440a0a241009', '0x10a77'],
                    '0x36'
                )

                const rpc = new Rpc({
                    client: mockClient as any,
                    verifyLogsBloom: true
                })

                const blocks = await rpc.getBlockBatch([68215], { receipts: true, transactions: true })
                expect(blocks).toHaveLength(1)
                expect(blocks[0].block.transactions.length).toEqual(6)
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

            it('recovers receipt via eth_getTransactionReceipt when missing from eth_getBlockReceipts', async () => {
                // Block 0x10a78 — tx 0xc453d4.. actually executed (nonce advanced,
                // contract deployed) but is consistently omitted by eth_getBlockReceipts.
                // We fall back to eth_getTransactionReceipt to recover the receipt.
                const fixtureBlock = loadBlock('cronos', 68216)
                const fixtureReceipts = loadReceipts('cronos', 68216)
                const recoveredReceipt = JSON.parse(fs.readFileSync(
                    Path.resolve(__dirname, 'fixtures/cronos/68216/tx-0xc453d4-receipt.json'),
                    'utf-8'
                ))
                expect(fixtureBlock.transactions.length).toEqual(2)
                expect(fixtureReceipts.length).toEqual(1)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(68216), true], fixtureBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(68216)], fixtureReceipts)
                // Nonce at block = 0x37 (advanced past tx.nonce 0x36), so tx is not phantom
                mockClient.setFixture(
                    'eth_getTransactionCount',
                    ['0xd494d1276b7e84da2a502ab3dfc3440a0a241009', '0x10a78'],
                    '0x37'
                )
                // Fallback: eth_getTransactionReceipt returns the missing receipt
                mockClient.setFixture(
                    'eth_getTransactionReceipt',
                    ['0xc453d4a77cfaf344f76523b2edaf4e4ba949facb53423c6b6e78d03f3f5f05fe'],
                    recoveredReceipt
                )

                const rpc = new Rpc({ client: mockClient as any })

                const blocks = await rpc.getBlockBatch([68216], { receipts: true, transactions: true })
                expect(blocks).toHaveLength(1)

                const block = blocks[0]
                expect(block.block.transactions.length).toEqual(2)
                expect(block.receipts?.length).toEqual(2)

                // Receipts are in tx-position order with matching transactionIndex values
                expect(block.receipts![0].transactionHash).toEqual(
                    '0xb539669a8e436df44646e279f439c4b55a809160deba92d81a86c993af54ec83'
                )
                expect(block.receipts![0].transactionIndex).toEqual('0x0')
                expect(block.receipts![1].transactionHash).toEqual(
                    '0xc453d4a77cfaf344f76523b2edaf4e4ba949facb53423c6b6e78d03f3f5f05fe'
                )
                expect(block.receipts![1].transactionIndex).toEqual('0x1')
                expect(block.receipts![1].status).toEqual('0x1')
                expect(block.receipts![1].contractAddress).toEqual(
                    '0xbc5498c2c403e204dbe2e1556bff1e80e08dcb53'
                )

                // All logs inside the recovered receipt point to its transactionIndex
                for (const log of block.receipts![1].logs) {
                    expect(log.transactionIndex).toEqual('0x1')
                }
            })

            it('throws when eth_getTransactionReceipt also cannot produce the missing receipt', async () => {
                const fixtureBlock = loadBlock('cronos', 68216)
                const fixtureReceipts = loadReceipts('cronos', 68216)

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(68216), true], fixtureBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(68216)], fixtureReceipts)
                mockClient.setFixture(
                    'eth_getTransactionCount',
                    ['0xd494d1276b7e84da2a502ab3dfc3440a0a241009', '0x10a78'],
                    '0x37'
                )
                // eth_getTransactionReceipt returns null too (e.g. Chainstack)
                mockClient.setFixture(
                    'eth_getTransactionReceipt',
                    ['0xc453d4a77cfaf344f76523b2edaf4e4ba949facb53423c6b6e78d03f3f5f05fe'],
                    null
                )

                const rpc = new Rpc({ client: mockClient as any })

                await expect(
                    rpc.getBlockBatch([68216], { receipts: true, transactions: true })
                ).rejects.toThrow(/failed to recover missing receipt/)
            })

            it('throws when recovered receipt belongs to a different block', async () => {
                const fixtureBlock = loadBlock('cronos', 68216)
                const fixtureReceipts = loadReceipts('cronos', 68216)
                const recoveredReceipt = JSON.parse(fs.readFileSync(
                    Path.resolve(__dirname, 'fixtures/cronos/68216/tx-0xc453d4-receipt.json'),
                    'utf-8'
                ))
                // Tamper the recovered receipt so it looks like it's from a different block
                const tamperedReceipt = {
                    ...recoveredReceipt,
                    blockHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
                }

                const mockClient = new MockRpcClient()
                mockClient.setFixture('eth_chainId', undefined, '0x19')
                mockClient.setFixture('eth_getBlockByNumber', [toQty(68216), true], fixtureBlock)
                mockClient.setFixture('eth_getBlockReceipts', ['latest'], fixtureReceipts)
                mockClient.setFixture('eth_getBlockReceipts', [toQty(68216)], fixtureReceipts)
                mockClient.setFixture(
                    'eth_getTransactionCount',
                    ['0xd494d1276b7e84da2a502ab3dfc3440a0a241009', '0x10a78'],
                    '0x37'
                )
                mockClient.setFixture(
                    'eth_getTransactionReceipt',
                    ['0xc453d4a77cfaf344f76523b2edaf4e4ba949facb53423c6b6e78d03f3f5f05fe'],
                    tamperedReceipt
                )

                const rpc = new Rpc({ client: mockClient as any })

                await expect(
                    rpc.getBlockBatch([68216], { receipts: true, transactions: true })
                ).rejects.toThrow(/different block/)
            })

            describe('trace-based logs bloom verification for leaked logs', () => {
                // Real-world case: Cronos block 0xaea9ed (11_446_765) contains
                // a reverted tx 0xd5da1c.. that emitted two logs inside its
                // call frame before the frame reverted. Those pre-revert log
                // bits ended up in the block's header logsBloom even though
                // the receipt reports zero logs. Verified to reproduce on both
                // Chainstack and dRPC Cronos mainnet endpoints.
                //
                // The fixtures for this test are the raw RPC responses:
                //   block.json                 — eth_getBlockByNumber result
                //   receipts.json              — eth_getBlockReceipts result
                //   tx-0xd5da1c-trace.json     — debug_traceTransaction
                //                                 (callTracer + withLog) result

                const BLOCK_NUMBER = 11_446_765
                const BLOCK_HEX = toQty(BLOCK_NUMBER)
                const REVERTED_TX = '0xd5da1cdc3b88c94a232008ece7111bafba3ac96f8067228432324d71bec25c21'
                const REVERTED_TX_SENDER = '0x2d35447967a80ef8ca0ef0c3a44e1c78b3b4c27a'
                const TRACE_CONFIG = {
                    tracer: 'callTracer',
                    tracerConfig: { onlyTopCall: false, withLog: true }
                }

                function loadTrace() {
                    return JSON.parse(fs.readFileSync(
                        Path.resolve(__dirname, 'fixtures/cronos/11446765/tx-0xd5da1c-trace.json'),
                        'utf-8'
                    ))
                }

                function setupMocks(mockClient: MockRpcClient, block: any, receipts: any[]) {
                    mockClient.setFixture('eth_chainId', undefined, '0x19')
                    mockClient.setFixture('eth_getBlockByNumber', [BLOCK_HEX, true], block)
                    mockClient.setFixture('eth_getBlockReceipts', ['latest'], receipts)
                    mockClient.setFixture('eth_getBlockReceipts', [BLOCK_HEX], receipts)
                    // nonceAfter = tx.nonce + 1 (reverted tx consumed the nonce,
                    // so the phantom detector correctly classifies it as NOT phantom).
                    mockClient.setFixture(
                        'eth_getTransactionCount',
                        [REVERTED_TX_SENDER, BLOCK_HEX],
                        '0x421'
                    )
                }

                it('accepts block when the reverted tx trace exactly explains the extra bloom bits', async () => {
                    const block = loadBlock('cronos', BLOCK_NUMBER)
                    const receipts = loadReceipts('cronos', BLOCK_NUMBER)

                    const mockClient = new MockRpcClient()
                    setupMocks(mockClient, block, receipts)
                    mockClient.setFixture('debug_traceTransaction', [REVERTED_TX, TRACE_CONFIG], loadTrace())

                    const rpc = new Rpc({ client: mockClient as any, verifyLogsBloom: true })

                    const blocks = await rpc.getBlockBatch([BLOCK_NUMBER], { receipts: true, transactions: true })
                    expect(blocks).toHaveLength(1)
                    // The reverted tx is kept (it consumed the nonce, not a phantom).
                    expect(blocks[0].block.transactions.length).toEqual(6)
                    expect(blocks[0].receipts?.length).toEqual(6)
                })

                it('throws when the reverted tx trace returns no logs to cover the extras', async () => {
                    const block = loadBlock('cronos', BLOCK_NUMBER)
                    const receipts = loadReceipts('cronos', BLOCK_NUMBER)

                    const mockClient = new MockRpcClient()
                    setupMocks(mockClient, block, receipts)
                    // Same trace frame, but with the leaked logs stripped out.
                    const brokenTrace = { ...loadTrace(), logs: [] }
                    mockClient.setFixture('debug_traceTransaction', [REVERTED_TX, TRACE_CONFIG], brokenTrace)

                    const rpc = new Rpc({ client: mockClient as any, verifyLogsBloom: true })

                    await expect(
                        rpc.getBlockBatch([BLOCK_NUMBER], { receipts: true, transactions: true })
                    ).rejects.toThrow(/traced logs.*do not fully explain/)
                })

                it('throws when header bloom has extra bits but no phantom or reverted txs are present', async () => {
                    const block = loadBlock('cronos', BLOCK_NUMBER)
                    const receipts = loadReceipts('cronos', BLOCK_NUMBER)
                    // Flip the reverted receipt's status to 0x1 so the code
                    // considers it a normal success — now nothing explains
                    // the extra bloom bits.
                    const tamperedReceipts = receipts.map(r =>
                        r.transactionHash === REVERTED_TX ? { ...r, status: '0x1' } : r
                    )

                    const mockClient = new MockRpcClient()
                    setupMocks(mockClient, block, tamperedReceipts)

                    const rpc = new Rpc({ client: mockClient as any, verifyLogsBloom: true })

                    await expect(
                        rpc.getBlockBatch([BLOCK_NUMBER], { receipts: true, transactions: true })
                    ).rejects.toThrow(/no phantom or reverted transactions/)
                })

                it('throws when the header bloom is missing a bit set in the computed bloom (not a superset)', async () => {
                    const block = loadBlock('cronos', BLOCK_NUMBER)
                    const receipts = loadReceipts('cronos', BLOCK_NUMBER)
                    // Clear every bit in the header bloom — now receipt logs set
                    // bits that the header does not. That means our receipts
                    // contain logs the node's bloom computation didn't account
                    // for, which the Ethermint leak bug cannot explain.
                    const tamperedBlock = {
                        ...block,
                        logsBloom: '0x' + '00'.repeat(256)
                    }

                    const mockClient = new MockRpcClient()
                    setupMocks(mockClient, tamperedBlock, receipts)

                    const rpc = new Rpc({ client: mockClient as any, verifyLogsBloom: true })

                    await expect(
                        rpc.getBlockBatch([BLOCK_NUMBER], { receipts: true, transactions: true })
                    ).rejects.toThrow(/bits not present in the header bloom/)
                })

                it('finds leaked logs in nested sub-call frames', async () => {
                    const block = loadBlock('cronos', BLOCK_NUMBER)
                    const receipts = loadReceipts('cronos', BLOCK_NUMBER)
                    // Move the leaked logs down into a nested sub-call frame
                    // to exercise the recursive collectFrameLogs walk.
                    const trace = loadTrace()
                    const nestedTrace = {
                        ...trace,
                        logs: [],
                        calls: [{ ...trace, calls: undefined }]
                    }

                    const mockClient = new MockRpcClient()
                    setupMocks(mockClient, block, receipts)
                    mockClient.setFixture('debug_traceTransaction', [REVERTED_TX, TRACE_CONFIG], nestedTrace)

                    const rpc = new Rpc({ client: mockClient as any, verifyLogsBloom: true })

                    const blocks = await rpc.getBlockBatch([BLOCK_NUMBER], { receipts: true, transactions: true })
                    expect(blocks).toHaveLength(1)
                    expect(blocks[0].block.transactions.length).toEqual(6)
                })
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
