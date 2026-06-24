import {BlockData, TransactionInfo} from './data'
import {HttpApi} from './http'


/**
 * Fetch a single block.
 *
 * Returns `undefined` when the block is not available
 * (e.g. when reading ahead of the chain head).
 */
export async function fetchBlock(httpApi: HttpApi, height: number, detail: boolean): Promise<BlockData | undefined> {
    let block = await httpApi.getBlock(height, detail)
    if (block == null) return undefined
    return {
        block,
        height: block.block_header.raw_data.number || 0,
        hash: block.blockID
    }
}


/**
 * Enrich a block with its transaction info (receipts, logs, internal transactions).
 *
 * Mutates `block.transactionsInfo` in place and returns `true` on success.
 * Returns `false` when the info is not yet consistent with the block
 * (some transactions are missing their info), so that the caller can retry.
 * The genesis block has no transaction info and is treated as consistent.
 */
export async function fetchTransactionsInfo(httpApi: HttpApi, block: BlockData): Promise<boolean> {
    // info isn't presented for the genesis block
    if (block.height == 0) return true

    let transactionsInfo = await httpApi.getTransactionInfo(block.height)

    let infoById: Record<string, TransactionInfo> = {}
    for (let info of transactionsInfo) {
        infoById[info.id] = info
    }

    for (let tx of block.block.transactions || []) {
        if (infoById[tx.txID] == null) return false
    }

    block.transactionsInfo = transactionsInfo
    return true
}


/**
 * Hash of the parent of a given block.
 */
export function getParentHash(block: BlockData): string {
    return block.block.block_header.raw_data.parentHash
}
