import {Block, mapRpcBlock} from '@subsquid/solana-normalization'
import type * as rpc from '@subsquid/solana-rpc-data'
import {PartialBlock} from '../data/partial'
import {DataRequest} from '../data/request'
import {filterBlockItems} from './filter'
import {projectFields} from './project'


export function mapBlock(src: rpc.Block, req: DataRequest, noVotes?: boolean): PartialBlock {
    let block = mapRpcBlock(src)
    if (noVotes) {
        removeVotes(block)
    }
    filterBlockItems(block, req)
    return projectFields(block, req.fields || {})
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