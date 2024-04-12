import {Bytes, FieldSelection} from '@subsquid/solana-stream'
import * as base from '@subsquid/solana-stream'


export type BlockHeader<F extends FieldSelection = {}> = base.BlockHeader<F>


export type Transaction<F extends FieldSelection = {}> = base.Transaction<F> & {
    id: string
    block: BlockHeader<F>
    instructions: Instruction<F>[]
    balances: Balance<F>[]
    tokenBalances: TokenBalance<F>[]
}


export type Instruction<F extends FieldSelection = {}> = base.Instruction<F> &
    ('data' extends keyof base.Instruction<F> ? {
        d1: Bytes
        d2: Bytes
        d4: Bytes
        d8: Bytes
    } : {}) &
    {
        block: BlockHeader<F>
        transaction?: Transaction<F>
        getTransaction(): Transaction<F>
        inner: Instruction<F>[]
        parent?: Instruction<F>
    }


export type LogMessage<F extends FieldSelection = {}> = base.LogMessage<F> & {
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
    instruction?: Instruction<F>
    getInstruction(): Instruction<F>
}


export type Balance<F extends FieldSelection = {}> = base.Balance<F> & {
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export type TokenBalance<F extends FieldSelection = {}> = base.TokenBalance<F> & {
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export type Reward<F extends FieldSelection = {}> = base.Reward<F>


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    instructions: Instruction<F>[]
    logs: LogMessage<F>[]
    balances: Balance<F>[]
    tokenBalances: TokenBalance<F>[]
    rewards: Reward<F>[]
}
