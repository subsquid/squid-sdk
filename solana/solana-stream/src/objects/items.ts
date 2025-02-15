import {Base58, Bytes} from '@subsquid/util-internal'
import {getInstructionDescriptor} from '../instruction'
import type * as base from './types'

// TODO: is it needed?
export {
    AddressTableLookup,
    BalanceFields,
    BalanceFieldSelection,
    BlockHeaderFields,
    BlockHeaderFieldSelection,
    Discriminator,
    InstructionFields,
    InstructionFieldSelection,
    LogMessageFields,
    LogMessageFieldSelection,
    PostTokenBalanceFields,
    PrePostTokenBalanceFields,
    PreTokenBalanceFields,
    RewardFields,
    RewardFieldSelection,
    TokenBalanceFields,
    TokenBalanceFieldSelection,
    TransactionFields,
    TransactionFieldSelection,
} from '@subsquid/portal-client/lib/query/solana'

export function blockFromPartial<F extends base.ReqiredFieldSelection>(src: base.BlockPartial<F>): base.Block<F> {
    // FIXME: why types are broken
    return Object.assign(new Block(), {
        header: Object.assign(new BlockHeader(), src.header),
        transactions: src.transactions?.map((i) => Object.assign(new Transaction(), i)) || [],
        instructions: src.instructions?.map((i) => Object.assign(new Instruction(), i)) || [],
        logs: src.logs?.map((i) => Object.assign(new LogMessage(), i)) || [],
        balances: src.balances?.map((i) => Object.assign(new Balance(), i)) || [],
        tokenBalances: src.tokenBalances?.map((i) => Object.assign(new TokenBalance(), i)) || [],
        rewards: src.rewards?.map((i) => Object.assign(new Reward(), i)) || [],
    }) as unknown as base.Block<F>
}

export interface Block extends base.Block {}
export class Block {}

export interface BlockHeader extends base.BlockHeader {}
export class BlockHeader {}

export interface Transaction extends base.Transaction {}
export class Transaction {
    #block!: Block
    #instructions?: Instruction[]
    #balances?: Balance[]
    #tokenBalances?: TokenBalance[]

    get block(): Block {
        return this.#block
    }

    set block(value: Block) {
        this.#block = value
    }

    get instructions(): Instruction[] {
        if (this.#instructions == null) {
            this.#instructions = []
        }
        return this.#instructions
    }

    set instructions(value: Instruction[]) {
        this.#instructions = value
    }

    get balances(): Balance[] {
        if (this.#balances == null) {
            this.#balances = []
        }
        return this.#balances
    }

    set balances(value: Balance[]) {
        this.#balances = value
    }

    get tokenBalances(): TokenBalance[] {
        if (this.#tokenBalances == null) {
            this.#tokenBalances = []
        }
        return this.#tokenBalances
    }

    set tokenBalances(value: TokenBalance[]) {
        this.#tokenBalances = value
    }
}

export interface Instruction extends base.Instruction {}
export class Instruction {
    #block!: Block
    #transaction?: Transaction
    #inner?: Instruction[]
    #parent?: Instruction
    #logs?: LogMessage[]
    #d1?: string
    #d2?: string
    #d4?: string
    #d8?: string

    get block(): Block {
        return this.#block
    }

    set block(value: Block) {
        this.#block = value
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        if (this.#transaction == null) {
            throw new Error(`Transaction is not set on instruction`)
        } else {
            return this.#transaction
        }
    }

    get inner(): Instruction[] {
        if (this.#inner == null) {
            this.#inner = []
        }
        return this.#inner
    }

    set inner(instructions: Instruction[]) {
        this.#inner = instructions
    }

    get parent(): Instruction | undefined {
        return this.#parent
    }

    set parent(value: Instruction | undefined) {
        this.#parent = value
    }

    get logs(): LogMessage[] {
        if (this.#logs == null) {
            this.#logs = []
        }
        return this.#logs
    }

    set logs(value: LogMessage[]) {
        this.#logs = value
    }

    get d1(): Bytes {
        return this.#d1 ?? (this.#d1 = this.d8.slice(0, 4))
    }

    get d2(): Bytes {
        return this.#d2 ?? (this.#d2 = this.d8.slice(0, 6))
    }

    get d4(): Bytes {
        return this.#d4 ?? (this.#d4 = this.d8.slice(0, 10))
    }

    get d8(): Bytes {
        if (this.#d8) {
            return this.#d8
        } else {
            if (this.data == null) {
                throw new Error(`.data field is not available`)
            }
            return (this.#d8 = getInstructionDescriptor(this as {data: Base58}))
        }
    }
}

export interface LogMessage extends base.LogMessage {}
export class LogMessage {
    #block!: Block
    #transaction?: Transaction
    #instruction?: Instruction

    get block(): Block {
        return this.#block
    }

    set block(value: Block) {
        this.#block = value
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        if (this.#transaction == null) {
            throw new Error(`Transaction is not set on log message`)
        } else {
            return this.#transaction
        }
    }

    get instruction(): Instruction | undefined {
        return this.#instruction
    }

    set instruction(value: Instruction | undefined) {
        this.#instruction = value
    }

    getInstruction(): Instruction {
        if (this.#instruction == null) {
            throw new Error(`Instruction is not set on log message`)
        } else {
            return this.#instruction
        }
    }
}

export interface Balance extends base.Balance {}
export class Balance {
    #block!: Block
    #transaction?: Transaction

    get block(): Block {
        return this.#block
    }

    set block(value: Block) {
        this.#block = value
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        if (this.#transaction == null) {
            throw new Error(`Transaction is not set on balance change record`)
        } else {
            return this.#transaction
        }
    }
}

type A = base.TokenBalance

export interface TokenBalance extends base.TokenBalance {}
export class TokenBalance {
    #block!: Block
    #transaction?: Transaction

    get block(): Block {
        return this.#block
    }

    set block(value: Block) {
        this.#block = value
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        if (this.#transaction == null) {
            throw new Error(`Transaction is not set on balance change record`)
        } else {
            return this.#transaction
        }
    }
}

export interface Reward extends base.Reward {}
export class Reward {}
