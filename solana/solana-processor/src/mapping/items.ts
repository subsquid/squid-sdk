import {Base58Bytes} from '@subsquid/solana-data'
import {HashAndHeight, shortHash} from '@subsquid/util-internal-processor-tools'
import {
    PartialBalance,
    PartialBlockHeader,
    PartialInstruction,
    PartialLogMessage,
    PartialTransaction
} from '../interfaces/data-partial'


export class Block {
    constructor(
        public header: BlockHeader
    ) {}

    transactions: Transaction[] = []
    instructions: Instruction[] = []
    logs: LogMessage[] = []
    balances: Balance[] = []
    // tokenBalances: PartialTokenBalance[] = []
    // rewards: PartialReward[] = []
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
}


export class Instruction implements PartialInstruction {
    id: string
    transactionIndex: number
    instructionAddress: number[]
    #block: BlockHeader
    #transaction?: Transaction
    #inner?: Instruction[]

    constructor(block: BlockHeader, i: PartialInstruction) {
        this.#block = block
        this.id = formatId(block, i.transactionIndex, ...i.instructionAddress)
        this.transactionIndex = i.transactionIndex
        this.instructionAddress = i.instructionAddress
        Object.assign(this, i)
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


function formatId(block: HashAndHeight, ...address: number[]): string {
    let no = block.height.toString().padStart(12, '0')
    let hash = shortHash(block.hash)
    let id = `${no}-${hash}`
    for (let index of address) {
        id += '-' + index.toString().padStart(6, '0')
    }
    return id
}
