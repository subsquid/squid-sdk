import {GetBlock, Transaction} from './schema'


export * from './schema'

/**
 * Base58 encoded bytes
 */
export type Base58Bytes = string


export function isVoteTransaction(tx: Transaction): boolean {
    if (tx.transaction.message.instructions.length != 1) return false
    let ins = tx.transaction.message.instructions[0]
    return tx.transaction.message.accountKeys[ins.programIdIndex] === 'Vote111111111111111111111111111111111111111'
}


export function removeVoteTransactions(block: GetBlock): void {
    if (!block.transactions) return
    block.transactions = block.transactions.filter((tx: Transaction, index) => {
        tx._index = tx._index ?? index
        return !isVoteTransaction(tx)
    })
}
