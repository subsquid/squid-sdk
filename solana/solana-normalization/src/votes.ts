import {Block} from './data'


export function removeVotes(block: Block): void {
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
