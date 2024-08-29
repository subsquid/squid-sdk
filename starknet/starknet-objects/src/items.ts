import {TransactionType} from '@subsquid/starknet-normalization'
import {
    PartialBlock,
    PartialBlockHeader,
    PartialTransaction,
    PartialEvent
} from '@subsquid/starknet-stream/lib/data/data-partial'
import {FELT} from '@subsquid/starknet-stream'
import {formatId} from './util'


export class Block {
    constructor(public header: BlockHeader) {}

    transactions: Transaction[] = []
    events: Event[] = []

    static fromPartial(src: PartialBlock): Block {
        let block = new Block(new BlockHeader(src.header))

        if (src.transactions) {
            block.transactions = src.transactions.map(i => new Transaction(block.header, i))
        }

        if (src.events) {
            block.events = src.events.map(i => new Event(block.header, i))
        }

        return block
    }
}

export class BlockHeader implements PartialBlockHeader {
    id: string
    height: number
    hash: FELT

    constructor(header: PartialBlockHeader) {
        this.id = formatId(header)
        this.height = header.height
        this.hash = header.hash
        Object.assign(this, header)
    }
}

export class Transaction implements PartialTransaction {
    // TODO: should it be breaken down according to TransactionType
    id: string
    transactionIndex: number
    type?: TransactionType
    #block: BlockHeader
    #events?: Event[]

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

    get events(): Event[] {
        if (this.#events == null) {
            this.#events = []
        }
        return this.#events
    }

    set events(value: Event[]) {
        this.#events = value
    }
}

export class Event implements PartialEvent {
    id: string
    eventIndex: number
    transactionIndex: number
    #block: BlockHeader
    #transaction?: Transaction

    constructor(
        block: BlockHeader,
        e: PartialEvent
    ) {
        this.id = formatId(block, e.transactionIndex, e.eventIndex)
        this.eventIndex = e.eventIndex
        this.transactionIndex = e.transactionIndex
        this.#block = block
        Object.assign(this, e)
    }

    get block(): BlockHeader {
        return this.#block
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        if (this.#transaction == null) {
            throw new Error(`Transaction is not set on event ${this.id}`)
        } else {
            return this.#transaction
        }
    }
}