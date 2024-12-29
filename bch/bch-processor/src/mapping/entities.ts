import {formatId} from '@subsquid/util-internal-processor-tools'
import {Bytes20, Bytes32, Bytes8} from '../interfaces/base.js'
import {
    OutputWithAddress
} from '../interfaces/bch.js'
import { TransactionBCH } from '@bitauth/libauth'


export class Block {
    header: BlockHeader
    transactions: Transaction[] = []

    constructor(header: BlockHeader) {
        this.header = header
    }
}


export class BlockHeader {
    id: string
    height: number
    hash: Bytes32
    parentHash: Bytes32
    nonce?: Bytes8
    difficulty?: bigint
    size?: bigint
    timestamp?: number

    constructor(
        height: number,
        hash: Bytes20,
        parentHash: Bytes20
    ) {
        this.id = formatId({height, hash})
        this.height = height
        this.hash = hash
        this.parentHash = parentHash
    }
}


export class Transaction {
    id: string
    transactionIndex: number
    hash?: string
    size?: number
    sourceOutputs?: OutputWithAddress[]
    inputs?: TransactionBCH["inputs"]
    locktime?: number
    outputs?: OutputWithAddress[]
    version?: number

    #block: BlockHeader

    constructor(
        block: BlockHeader,
        transactionIndex: number
    ) {
        this.id = formatId(block, transactionIndex)
        this.transactionIndex = transactionIndex
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }
}
