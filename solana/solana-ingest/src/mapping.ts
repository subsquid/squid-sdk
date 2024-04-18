import {Block, mapRpcBlock} from '@subsquid/solana-normalization'
import {Reward, Transaction} from '@subsquid/solana-rpc-data'
import {array, assertValidity, B58, GetSrcType, NAT, object} from '@subsquid/util-internal-validation'


const GetBlock = object({
    blockHeight: NAT,
    blockTime: NAT,
    blockhash: B58,
    parentSlot: NAT,
    previousBlockhash: B58,
    transactions: array(Transaction),
    rewards: array(Reward)
})


const RawBlock = object({
    hash: B58,
    height: NAT,
    slot: NAT,
    block: GetBlock
})


export type RawBlock = GetSrcType<typeof RawBlock>


export function mapRawBlock(raw: unknown, noVotes: boolean): Block {
    assertValidity(RawBlock, raw)
    let block = mapRpcBlock(raw)
    if (noVotes) {
        removeVotes(block)
    }
    return block
}


function removeVotes(block: Block): void {
    let removed = new Set<number>()

    for (let i of block.instructions) {
        if (i.programId == 'Vote111111111111111111111111111111111111111') {
            removed.add(i.transactionIndex)
        }
    }

    function kept(item: {transactionIndex: number}): boolean {
        return !removed.has(item.transactionIndex)
    }

    block.transactions = block.transactions.filter(kept)
    block.instructions = block.instructions.filter(kept)
    block.logs = block.logs.filter(kept)
    block.balances = block.balances.filter(kept)
    block.tokenBalances = block.tokenBalances.filter(kept)
}
