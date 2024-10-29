import * as tools from '@subsquid/util-internal-processor-tools'
import {
    PartialBlock,
    PartialBlockHeader,
    PartialLog,
    PartialTransaction,
    PartialInternalTransaction
} from '../data/data-partial'


export class Block {
    constructor(public header: BlockHeader) {}

    transactions: Transaction[] = []
    logs: Log[] = []
    internalTransactions: InternalTransaction[] = []

    static fromPartial(src: PartialBlock): Block {
        let block = new Block(new BlockHeader(src.header))

        if (src.transactions) {
            block.transactions = src.transactions.map(i => new Transaction(block.header, i))
        }

        if (src.logs) {
            block.logs = src.logs.map(i => new Log(block.header, i))
        }

        if (src.internalTransactions) {
            block.internalTransactions = src.internalTransactions.map(i => {
                return new InternalTransaction(block.header, i)
            })
        }

        return block
    }
}


export class BlockHeader implements PartialBlockHeader {
    id: string
    height: number
    hash: string
    parentHash: string

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
    #logs?: Log[]
    #internalTransactions?: InternalTransaction[]

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

    get logs(): Log[] {
        if (this.#logs == null) {
            this.#logs = []
        }
        return this.#logs
    }

    set logs(value: Log[]) {
        this.#logs = value
    }

    get internalTransactions(): InternalTransaction[] {
        if (this.#internalTransactions == null) {
            this.#internalTransactions = []
        }
        return this.#internalTransactions
    }

    set internalTransactions(value: InternalTransaction[]) {
        this.#internalTransactions = value
    }
}


export class Log implements PartialLog {
    id: string
    logIndex: number
    transactionIndex: number
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader, i: PartialLog) {
        this.#block = block
        this.id = formatId(block, i.transactionIndex, i.logIndex)
        this.logIndex = i.logIndex
        this.transactionIndex = i.transactionIndex
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
            throw new Error(`Transaction is not set on log ${this.id}`)
        } else {
            return this.#transaction
        }
    }
}


export class InternalTransaction implements PartialInternalTransaction {
    id: string
    internalTransactionIndex: number
    transactionIndex: number
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader, src: PartialInternalTransaction) {
        this.#block = block
        this.id = formatId(block, src.transactionIndex, src.internalTransactionIndex)
        this.internalTransactionIndex = src.internalTransactionIndex
        this.transactionIndex = src.transactionIndex
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
            throw new Error(`Transaction is not set on internal transaction ${this.id}`)
        } else {
            return this.#transaction
        }
    }
}


function formatId(block: tools.HashAndHeight, ...address: number[]): string {
    // skip first 8 bytes containing block number
    let hash = block.hash.slice(16)
    let height = block.height
    return tools.formatId({height, hash}, ...address)
}
