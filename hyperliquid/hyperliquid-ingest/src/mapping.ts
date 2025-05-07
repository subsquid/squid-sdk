import {RawBlock} from './data'


export interface Transaction {
    transactionIndex: number
    user: string
    actions: object[]
    rawTxHash: null | string
    error: null | string
}


export interface BlockHeader {
    height: number
    hash: string
    parentHash: string
    proposer: string
    blockTime: number
}


export interface Block {
    header: BlockHeader
    transactions: Transaction[]
}


export function mapRawBlock(raw: RawBlock, prevHash: string): Block {
    let header = {
        height: raw.header.height,
        hash: raw.header.hash,
        parentHash: prevHash,
        proposer: raw.header.proposer,
        blockTime: Date.parse(raw.header.block_time)
    }

    let transactions = raw.txs.map((tx, index) => {
        return {
            transactionIndex: index,
            user: tx.user,
            actions: tx.actions,
            rawTxHash: tx.raw_tx_hash,
            error: tx.error
        }
    })

    return {
        header,
        transactions
    }
}
