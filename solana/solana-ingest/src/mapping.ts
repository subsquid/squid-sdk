import {Reward, Transaction} from '@subsquid/solana-rpc-data'
import {array, B58, GetSrcType, NAT, object} from '@subsquid/util-internal-validation'


export const GetBlock = object({
    blockHeight: NAT,
    blockTime: NAT,
    blockhash: B58,
    parentSlot: NAT,
    previousBlockhash: B58,
    transactions: array(Transaction),
    rewards: array(Reward)
})


export type GetBlock = GetSrcType<typeof GetBlock>


export const RawBlock = object({
    hash: B58,
    height: NAT,
    slot: NAT,
    block: GetBlock
})


export type RawBlock = GetSrcType<typeof RawBlock>


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
