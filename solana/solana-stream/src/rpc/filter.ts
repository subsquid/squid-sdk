import {
    Balance,
    Block,
    Instruction,
    LogMessage,
    Reward,
    TokenBalance,
    Transaction
} from '@subsquid/solana-normalization'
import {bisect, def, groupBy, weakMemo} from '@subsquid/util-internal'
import {EntityFilter, FilterBuilder} from '@subsquid/util-internal-processor-tools'
import assert from 'assert'
import {
    BalanceRequestRelations,
    DataRequest,
    InstructionRequestRelations,
    LogRequestRelations,
    TokenBalanceRequestRelations,
    TransactionRequestRelations
} from '../data/request'
import {getInstructionDescriptor} from '../instruction'


function buildTransactionFilter(dataRequest: DataRequest): EntityFilter<Transaction, TransactionRequestRelations> {
    let items = new EntityFilter()
    for (let req of dataRequest.transactions ?? []) {
        let filter = new FilterBuilder<Transaction>()
        let where = req.where || {}
        filter.getIn(tx => tx.accountKeys[0], where.feePayer)
        items.add(filter, req.include || {})
    }
    return items
}


function buildInstructionFilter(dataRequest: DataRequest): EntityFilter<Instruction, InstructionRequestRelations> {
    let items = new EntityFilter()
    for (let req of dataRequest.instructions ?? []) {
        let filter = new FilterBuilder<Instruction>()
        let where = req.where || {}
        filter.propIn('programId', where.programId)
        filter.matchAny((i, d) => getInstructionDescriptor(i).startsWith(d), where.d1)
        filter.matchAny((i, d) => getInstructionDescriptor(i).startsWith(d), where.d2)
        filter.matchAny((i, d) => getInstructionDescriptor(i).startsWith(d), where.d4)
        filter.getIn(getInstructionDescriptor, where.d8)
        filter.getIn(i => i.accounts[0], where.a0)
        filter.getIn(i => i.accounts[1], where.a1)
        filter.getIn(i => i.accounts[2], where.a2)
        filter.getIn(i => i.accounts[3], where.a3)
        filter.getIn(i => i.accounts[4], where.a4)
        filter.getIn(i => i.accounts[5], where.a5)
        filter.getIn(i => i.accounts[6], where.a6)
        filter.getIn(i => i.accounts[7], where.a7)
        filter.getIn(i => i.accounts[8], where.a8)
        filter.getIn(i => i.accounts[9], where.a9)
        if (where.isCommitted != null) {
            filter.propIn('isCommitted', [where.isCommitted])
        }
        items.add(filter, req.include ?? {})
    }
    return items
}


function buildLogFilter(dataRequest: DataRequest): EntityFilter<LogMessage, LogRequestRelations> {
    let items = new EntityFilter()
    for (let req of dataRequest.logs ?? []) {
        let filter = new FilterBuilder<LogMessage>()
        let where = req.where ?? {}
        filter.propIn('programId', where.programId)
        filter.propIn('kind', where.kind)
        items.add(filter, req.include ?? {})
    }
    return items
}


function buildBalanceFilter(dataRequest: DataRequest): EntityFilter<Balance, BalanceRequestRelations> {
    let items = new EntityFilter()
    for (let req of dataRequest.balances ?? []) {
        let filter = new FilterBuilder<Balance>()
        let where = req.where || {}
        filter.propIn('account', where.account)
        items.add(filter, req.include || {})
    }
    return items
}


function buildTokenBalanceFilter(dataRequest: DataRequest): EntityFilter<TokenBalance, TokenBalanceRequestRelations> {
    let items = new EntityFilter()
    for (let req of dataRequest.tokenBalances ?? []) {
        let filter = new FilterBuilder<TokenBalance>()
        let where = req.where || {}
        filter.propIn('account', where.account)
        filter.propIn('preProgramId', where.preProgramId)
        filter.propIn('postProgramId', where.postProgramId)
        filter.propIn('preMint', where.preMint)
        filter.propIn('postMint', where.postMint)
        filter.propIn('preOwner', where.preOwner)
        filter.propIn('postOwner', where.postOwner)
        items.add(filter, req.include || {})
    }
    return items
}


function buildRewardsFilter(dataRequest: DataRequest): EntityFilter<Reward, {}> {
    let items = new EntityFilter()
    for (let req of dataRequest.rewards ?? []) {
        let filter = new FilterBuilder<Reward>()
        let where = req.where || {}
        filter.propIn('pubkey', where.pubkey)
        items.add(filter, {})
    }
    return items
}


const getItemFilters = weakMemo((req: DataRequest) => {
    return {
        transactions: buildTransactionFilter(req),
        instructions: buildInstructionFilter(req),
        logs: buildLogFilter(req),
        balances: buildBalanceFilter(req),
        tokenBalances: buildTokenBalanceFilter(req),
        rewards: buildRewardsFilter(req)
    }
})


class IncludeSet {
    transactions = new Set<Transaction>
    instructions = new Set<Instruction>
    logs = new Set<LogMessage>
    balances = new Set<Balance>
    tokenBalances = new Set<TokenBalance>
    rewards = new Set<Reward>
}


export function filterBlockItems(block: Block, req: DataRequest): void {
    new BlockFilter(block, req).apply()
}


class BlockFilter {
    private include = new IncludeSet()
    private items: ReturnType<typeof getItemFilters>

    constructor(private block: Block, req: DataRequest) {
        this.items = getItemFilters(req)
    }

    @def
    private transactions(): Map<number, Transaction> {
       return new Map(this.block.transactions.map(tx => [tx.transactionIndex, tx]))
    }

    private getTransaction(idx: number): Transaction {
        let tx = this.transactions().get(idx)
        assert(tx)
        return tx
    }

    @def
    private logsByTx(): Map<number, LogMessage[]> {
        return groupBy(this.block.logs, log => log.transactionIndex)
    }

    @def
    private instructionsByTx(): Map<number, Instruction[]> {
        return groupBy(this.block.instructions, i => i.transactionIndex)
    }

    @def
    private balancesByTx(): Map<number, Balance[]> {
        return groupBy(this.block.balances, b => b.transactionIndex)
    }

    @def
    private tokenBalancesByTx(): Map<number, TokenBalance[]> {
        return groupBy(this.block.tokenBalances, b => b.transactionIndex)
    }

    private filterTransactions(): void {
        if (!this.items.transactions.present()) return
        for (let tx of this.block.transactions) {
            let rel = this.items.transactions.match(tx)
            if (rel == null) continue
            this.include.transactions.add(tx)
            if (rel.logs) {
                include(this.include.logs, this.logsByTx().get(tx.transactionIndex))
            }
            if (rel.instructions) {
                include(this.include.instructions, this.instructionsByTx().get(tx.transactionIndex))
            }
            if (rel.balances) {
                include(this.include.balances, this.balancesByTx().get(tx.transactionIndex))
            }
            if (rel.tokenBalances) {
                include(this.include.tokenBalances, this.tokenBalancesByTx().get(tx.transactionIndex))
            }
        }
    }

    private filterInstructions(): void {
        if (!this.items.instructions.present()) return
        for (let i = 0; i < this.block.instructions.length; i++) {
            let ins = this.block.instructions[i]
            let rel = this.items.instructions.match(ins)
            if (rel == null) continue
            this.include.instructions.add(ins)
            if (rel.innerInstructions) {
                for (let j = i + 1; j < this.block.instructions.length; j++) {
                    let child = this.block.instructions[j]
                    if (
                        ins.transactionIndex == child.transactionIndex &&
                        isChildAddress(ins.instructionAddress, child.instructionAddress)
                    ) {
                        this.include.instructions.add(child)
                    } else {
                        break
                    }
                }
            }
            if (rel.logs) {
                let logs = this.logsByTx().get(ins.transactionIndex) ?? []
                include(this.include.logs, findInstructionChildren(logs, ins.instructionAddress))
            }
            if (rel.transaction) {
                this.include.transactions.add(this.getTransaction(ins.transactionIndex))
            }
            if (rel.transactionBalances) {
                include(this.include.balances, this.balancesByTx().get(ins.transactionIndex))
            }
            if (rel.transactionTokenBalances) {
                include(this.include.tokenBalances, this.tokenBalancesByTx().get(ins.transactionIndex))
            }
            if (rel.transactionInstructions) {
                include(this.include.instructions, this.instructionsByTx().get(ins.transactionIndex))
            }
        }
    }

    private filterLogs(): void {
        if (!this.items.logs.present()) return
        for (let log of this.block.logs) {
            let rel = this.items.logs.match(log)
            if (rel == null) continue
            this.include.logs.add(log)
            if (rel.transaction) {
                this.include.transactions.add(this.getTransaction(log.transactionIndex))
            }
            if (rel.instruction) {
                this.include.instructions.add(this.getInstruction(log.transactionIndex, log.instructionAddress))
            }
        }
    }

    private getInstruction(transactionIdx: number, address: number[]): Instruction {
        let pos = bisect(
            this.block.instructions,
            null,
            ins => ins.transactionIndex - transactionIdx || addressCompare(ins.instructionAddress, address)
        )
        let ins = this.block.instructions[pos]
        assert(
            ins &&
            ins.transactionIndex == transactionIdx &&
            addressCompare(ins.instructionAddress, address) == 0
        )
        return ins
    }

    private filterTokenBalances(): void {
        if (!this.items.tokenBalances.present()) return
        for (let balance of this.block.tokenBalances) {
            let rel = this.items.tokenBalances.match(balance)
            if (rel == null) continue
            this.include.tokenBalances.add(balance)
            if (rel.transaction) {
                this.include.transactions.add(this.getTransaction(balance.transactionIndex))
            }
            if (rel.transactionInstructions) {
                include(this.include.instructions, this.instructionsByTx().get(balance.transactionIndex))
            }
        }
    }

    private filterBalances(): void {
        if (!this.items.balances.present()) return
        for (let balance of this.block.balances) {
            let rel = this.items.balances.match(balance)
            if (rel == null) continue
            this.include.balances.add(balance)
            if (rel.transaction) {
                this.include.transactions.add(this.getTransaction(balance.transactionIndex))
            }
            if (rel.transactionInstructions) {
                include(this.include.instructions, this.instructionsByTx().get(balance.transactionIndex))
            }
        }
    }

    private filterRewards(): void {
        if (!this.items.rewards.present() || this.block.rewards == null) return
        for (let reward of this.block.rewards) {
            if (this.items.rewards.match(reward)) {
                this.include.rewards.add(reward)
            }
        }
    }

    apply(): void {
        this.filterTransactions()
        this.filterInstructions()
        this.filterLogs()
        this.filterBalances()
        this.filterTokenBalances()
        this.filterRewards()
        this.block.transactions = this.block.transactions.filter(i => this.include.transactions.has(i))
        this.block.instructions = this.block.instructions.filter(i => this.include.instructions.has(i))
        this.block.logs = this.block.logs.filter(i => this.include.logs.has(i))
        this.block.balances = this.block.balances.filter(i => this.include.balances.has(i))
        this.block.tokenBalances = this.block.tokenBalances.filter(i => this.include.tokenBalances.has(i))
        this.block.rewards = this.block.rewards.filter(i => this.include.rewards.has(i))
    }
}


function include<T>(set: Set<T>, items?: Iterable<T>): void {
    if (items == null) return
    for (let it of items) {
        set.add(it)
    }
}


function* findInstructionChildren<I extends {instructionAddress: number[]}>(
    items: I[],
    addr: number[],
): Iterable<I> {
    if (items.length == 0) return
    let beg = bisect(items, addr, (ins, addr) => addressCompare(ins.instructionAddress, addr))
    while (beg < items.length && isChildAddress(items[beg].instructionAddress, addr)) {
        yield items[beg]
        beg += 1
    }
}


function isChildAddress(parent: number[], addr: number[]): boolean {
    if (parent.length > addr.length) return false
    for (let i = 0; i < parent.length; i++) {
        if (parent[i] !== addr[i]) return false
    }
    return true
}


function addressCompare(a: number[], b: number[]): number {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        let order = a[i] - b[i]
        if (order) return order
    }
    return a.length - b.length
}
