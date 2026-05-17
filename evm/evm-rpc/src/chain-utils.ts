import {assertNotNull} from '@subsquid/util-internal'
import {GetBlock, Log, Receipt, Transaction} from './rpc-data'
import {Qty} from './types'
import {
    blockHash,
    tempoBlockHash,
    logsBloom,
    receiptsRoot,
    recoverTxSender,
    transactionsRoot,
    calculateStateSyncTxHash
} from './verification'
import {getTxHash, qty2Int} from './util'


// Cronos (Ethermint) had a cluster of EVM-module bugs (phantom transactions,
// missing receipts, logs-bloom leakage) that were fixed well before block 20M.
// Our Cronos-specific RPC fixes are only enabled for blocks below this cutoff
// so they do not silently paper over new/unrelated bugs on recent data.
export const CRONOS_ETHERMINT_BUG_LAST_BLOCK = 20_000_000


export interface ChainUtilsOptions {
    useGasUsedForReceiptsRoot?: boolean
}


export class ChainUtils {
    public readonly isPolygonMainnet: boolean
    public readonly isHyperliquidMainnet: boolean
    public readonly isHyperliquidTestnet: boolean
    public readonly isStable: boolean
    public readonly isTempo: boolean
    public readonly isCronosMainnet: boolean
    public readonly isShibariumMainnet: boolean
    public readonly isPolygonBased: boolean
    public readonly useGasUsedForReceiptsRoot: boolean

    constructor(chainId: Qty, options?: ChainUtilsOptions) {
        this.isPolygonMainnet = chainId == '0x89'
        this.isHyperliquidMainnet = chainId == '0x3e7'
        this.isHyperliquidTestnet = chainId == '0x3e6'
        this.isStable = chainId == '0x3dc' || chainId == '0x899' // Chain ID 988 (mainnet) or 2201 (testnet)
        // Tempo mainnet (4217), Moderato testnet (42431), Andantino testnet (42429)
        // https://drpc.org/chainlist/tempo-mainnet-rpc
        // https://drpc.org/chainlist/tempo-moderato-testnet-rpc
        // https://drpc.org/chainlist/tempo-testnet-rpc
        this.isTempo = chainId == '0x1079' || chainId == '0xa5bf' || chainId == '0xa5bd'
        this.isCronosMainnet = chainId == '0x19' // Chain ID 25
        this.isShibariumMainnet = chainId == '0x6d'
        this.isPolygonBased = this.isPolygonMainnet || this.isShibariumMainnet
        this.useGasUsedForReceiptsRoot = options?.useGasUsedForReceiptsRoot ?? false
    }

    /**
     * True when a block falls within the Cronos mainnet block range affected by
     * the Ethermint EVM-module bugs that our Cronos fixes compensate for.
     * Used by both ChainUtils (logs bloom tolerance) and the Rpc class (phantom
     * tx stripping, missing-receipt recovery) to gate their Cronos-only logic.
     */
    isCronosEthermintBugBlock(blockNumber: Qty): boolean {
        return this.isCronosMainnet && qty2Int(blockNumber) < CRONOS_ETHERMINT_BUG_LAST_BLOCK
    }

    calculateBlockHash(block: GetBlock) {
        // Tempo extends the Ethereum header with additional fields
        if (this.isTempo) {
            return tempoBlockHash(block)
        }
        return blockHash(block)
    }

    calculateTransactionsRoot(block: GetBlock) {
        let transactions = block.transactions as Transaction[]

        if (this.isPolygonBased) {
            let stateSyncTxHash = calculateStateSyncTxHash(block.number, block.hash)
            let txs = []
            for (let tx of transactions) {
                if (tx.type == '0x7f') {
                    // PIP-74 tx type requires extra data that can't be obtained from rpc
                    // so for now blocks that contain this tx type aren't verified
                    return block.transactionsRoot
                }

                if (tx.hash != stateSyncTxHash) {
                    txs.push(tx)
                }
            }
            transactions = txs
        }

        if (this.isHyperliquidMainnet || this.isHyperliquidTestnet) {
            transactions = transactions.filter(tx => !isHyperliquidSystemTx(tx))
        }

        return transactionsRoot(transactions)
    }

    calculateLogsBloom(block: GetBlock, logs: Log[]) {
        if (this.isPolygonBased) {
            let transactions = block.transactions as Transaction[]
            let txByHash = new Map(transactions.map(tx => [getTxHash(tx), tx]))
            let stateSyncTxHash = calculateStateSyncTxHash(block.number, block.hash)
            logs = logs.filter(log => {
                let tx = assertNotNull(txByHash.get(log.transactionHash))
                return tx.hash != stateSyncTxHash
            })
        }

        if (this.isHyperliquidMainnet || this.isHyperliquidTestnet) {
            let transactions = block.transactions as Transaction[]
            let txByHash = new Map(transactions.map(tx => [getTxHash(tx), tx]))
            // Hyperliquid system txs (gasPrice=0x0) appear in block receipts/logs but not
            // in block.transactions. Skip logs whose tx hash is absent from the tx map.
            logs = logs.filter(log => {
                let tx = txByHash.get(log.transactionHash)
                if (tx == null) return false
                return !isHyperliquidSystemTx(tx)
            })
        }

        return logsBloom(logs)
    }

    calculateReceiptsRoot(block: GetBlock, receipts: Receipt[]) {
        if (this.isPolygonBased) {
            let stateSyncTxHash = calculateStateSyncTxHash(block.number, block.hash)
            receipts = receipts.filter(receipt => receipt.transactionHash != stateSyncTxHash)
        }

        if (this.isHyperliquidMainnet || this.isHyperliquidTestnet) {
            receipts = receipts.filter(receipt => !isHyperliquidSystemReceipt(receipt))
        }

        if (this.useGasUsedForReceiptsRoot) {
            return receiptsRoot(receipts, {useGasUsed: true})
        }

        return receiptsRoot(receipts)
    }

    recoverTxSender(transaction: Transaction) {
        if (this.isHyperliquidMainnet || this.isHyperliquidTestnet) {
            if (isHyperliquidSystemTx(transaction)) return
        }

        // Stable system transactions are legacy txs with a fake signature (r=0, s=0)
        // sent from the zero address to system contracts. They cannot be ECDSA-recovered.
        if (this.isStable) {
            if (isStableSystemTx(transaction)) return
        }

        // Tempo system transactions are legacy txs with a fake signature (r=0, s=0)
        // and sender set to Address::ZERO. They cannot be ECDSA-recovered.
        // https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/envelope.rs
        if (this.isTempo) {
            if (isTempoSystemTx(transaction)) return
        }

        return recoverTxSender(transaction)
    }
}


function isHyperliquidSystemTx(tx: Transaction) {
    // https://github.com/hl-archive-node/nanoreth/blob/732f8c574db2dde90344a29b0292189a5cddd2d1/src/node/primitives/transaction.rs#L165
    return tx.gasPrice == '0x0'
}


function isTempoSystemTx(tx: Transaction) {
    // Tempo system transactions are legacy (type 0x0) with a fake signature (r=0, s=0).
    // https://github.com/tempoxyz/tempo/blob/main/crates/primitives/src/transaction/envelope.rs
    return tx.type == '0x0' && tx.r == '0x0' && tx.s == '0x0'
}


function isStableSystemTx(tx: Transaction) {
    // Stable system txs have a fake signature (r=0, s=0) and can be legacy (0x0) or EIP-1559 (0x2)
    return tx.r == '0x0' && tx.s == '0x0'
}


function isHyperliquidSystemReceipt(receipt: Receipt) {
    // https://github.com/hl-archive-node/nanoreth/blob/732f8c574db2dde90344a29b0292189a5cddd2d1/src/addons/hl_node_compliance.rs#L365
    return receipt.cumulativeGasUsed == '0x0'
}


