import {Base58Bytes, Bytes, D8_SYM, DATA_SYM, getInstructionDescriptor} from '@subsquid/solana-stream'
import {
    PartialBalance,
    PartialBlock,
    PartialBlockHeader,
    PartialInstruction,
    PartialLogMessage,
    PartialReward,
    PartialTokenBalance,
    PartialTransaction
} from '@subsquid/solana-stream/lib/data/partial'
import {formatId} from './util'


export class Block {
    constructor(
        public header: BlockHeader,
        public transactions: Transaction[],
        public instructions: Instruction[],
        public logs: LogMessage[],
        public balances: Balance[],
        public tokenBalances: TokenBalance[],
        public rewards: PartialReward[]
    ) {}

    static fromPartial(src: PartialBlock): Block {
        let header = new BlockHeader(src.header)

        return new Block(
            header,
            src.transactions.map(i => new Transaction(header, i)),
            src.instructions.map(i => new Instruction(header, i)),
            src.logs.map(i => new LogMessage(header, i)),
            src.balances.map(i => new Balance(header, i)),
            src.tokenBalances.map(i => new TokenBalance(header, i)),
            src.rewards
        )
    }
}


export class BlockHeader implements PartialBlockHeader {
    id: string
    height: number
    hash: Base58Bytes
    parentHash: Base58Bytes

    constructor(header: PartialBlockHeader) {
        this.id = formatId(header)
        this.height = header.height
        this.hash = header.hash
        this.parentHash = header.parentHash
        Object.assign(this, header)
    }
}


export class Transaction implements PartialTransaction {
    id: string
    transactionIndex: number
    #block: BlockHeader
    #instructions?: Instruction[]
    #balances?: Balance[]
    #tokenBalances?: TokenBalance[]

    constructor(block: BlockHeader, tx: PartialTransaction) {
        this.id = formatId(block, tx.transactionIndex)
        this.transactionIndex = tx.transactionIndex
        this.#block = block
        Object.assign(this, tx)
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
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


export class Instruction implements PartialInstruction {
    id: string
    transactionIndex: number
    instructionAddress: number[]
    data?: Bytes
    #block: BlockHeader
    #transaction?: Transaction
    #inner?: Instruction[]
    #parent?: Instruction
    #logs?: LogMessage[]
    #d1?: string
    #d2?: string
    #d4?: string
    #d8?: string

    constructor(block: BlockHeader, i: PartialInstruction) {
        this.#block = block
        this.id = formatId(block, i.transactionIndex, ...i.instructionAddress)
        this.transactionIndex = i.transactionIndex
        this.instructionAddress = i.instructionAddress
        Object.assign(this, i)
        ;(this as any)[D8_SYM] = (i as any)[D8_SYM]
        ;(this as any)[DATA_SYM] = (i as any)[DATA_SYM]
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
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
            throw new Error(`Transaction is not set on instruction ${this.id}`)
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
        if (this.#d1) {
            return this.#d1
        } else {
            return this.#d1 = this.d8.slice(0, 4)
        }
    }

    get d2(): Bytes {
        if (this.#d2) {
            return this.#d2
        } else {
            return this.#d2 = this.d8.slice(0, 6)
        }
    }

    get d4(): Bytes {
        if (this.#d4) {
            return this.#d4
        } else {
            return this.#d4 = this.d8.slice(0, 10)
        }
    }

    get d8(): Bytes {
        if (this.#d8) {
            return this.#d8
        } else {
            if (this.data == null) {
                throw new Error(`.data field is not available`)
            }
            return this.#d8 = getInstructionDescriptor(this as {data: Base58Bytes})
        }
    }
}


export class LogMessage implements PartialLogMessage {
    id: string
    transactionIndex: number
    logIndex: number
    instructionAddress: number[]
    #block: BlockHeader
    #transaction?: Transaction
    #instruction?: Instruction

    constructor(block: BlockHeader, src: PartialLogMessage) {
        this.#block = block
        this.id = formatId(block, src.transactionIndex, src.logIndex)
        this.transactionIndex = src.transactionIndex
        this.logIndex = src.logIndex
        this.instructionAddress = src.instructionAddress
        Object.assign(this, src)
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
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
            throw new Error(`Transaction is not set on log message ${this.id}`)
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
            throw new Error(`Instruction is not set on log message ${this.id}`)
        } else {
            return this.#instruction
        }
    }
}


export class Balance implements PartialBalance {
    transactionIndex: number
    account: Base58Bytes
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader, src: PartialBalance) {
        this.#block = block
        this.transactionIndex = src.transactionIndex
        this.account = src.account
        Object.assign(this, src)
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
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
            throw new Error(`Transaction is not set on balance change record ${this.block.id}-${this.account}`)
        } else {
            return this.#transaction
        }
    }
}


export class TokenBalance implements PartialTokenBalance {
    id: string
    transactionIndex: number
    account: Base58Bytes
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader, src: PartialTokenBalance) {
        this.id = formatId(block, src.transactionIndex) + '-' + src.account
        this.transactionIndex = src.transactionIndex
        this.account = src.account
        this.#block = block
        Object.assign(this, src)
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
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
            throw new Error(`Transaction is not set on balance change record ${this.block.id}-${this.account}`)
        } else {
            return this.#transaction
        }
    }
}
