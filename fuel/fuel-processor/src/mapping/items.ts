import {ReceiptType, TransactionType} from '@subsquid/fuel-data/lib/data'
import {HashAndHeight, shortHash} from '@subsquid/util-internal-processor-tools'
import {unexpectedCase} from '@subsquid/util-internal'
import {
    PartialOutput,
    PartialBlock,
    PartialBlockHeader,
    PartialReceipt,
    PartialTransaction,
    PartialInput
} from '../interfaces/data-partial'
import {Bytes} from '../interfaces/data'


export class Block {
    constructor(public header: BlockHeader) {}

    transactions: Transaction[] = []
    receipts: Receipt[] = []
    inputs: Input[] = []
    outputs: Output[] = []

    static fromPartial(src: PartialBlock): Block {
        let block = new Block(new BlockHeader(src.header))

        if (src.transactions) {
            block.transactions = src.transactions.map(i => new Transaction(block.header, i))
        }

        if (src.receipts) {
            block.receipts = src.receipts.map(i => new Receipt(block.header, i))
        }

        if (src.inputs) {
            block.inputs = src.inputs.map(i => {
                switch (i.type) {
                    case 'InputCoin':
                        return new InputCoin(block.header, i)
                    case 'InputContract':
                        return new InputContract(block.header, i)
                    case 'InputMessage':
                        return new InputMessage(block.header, i)
                    default:
                        throw unexpectedCase(i.type)
                }
            })
        }

        if (src.outputs) {
            block.outputs = src.outputs.map(i => {
                switch (i.type) {
                    case 'ChangeOutput':
                        return new ChangeOutput(block.header, i)
                    case 'CoinOutput':
                        return new CoinOutput(block.header, i)
                    case 'ContractCreated':
                        return new ContractCreated(block.header, i)
                    case 'ContractOutput':
                        return new ContractOutput(block.header, i)
                    case 'VariableOutput':
                        return new VariableOutput(block.header, i)
                    default:
                        throw unexpectedCase(i.type)
                }
            })
        }

        return block
    }
}


export class BlockHeader implements PartialBlockHeader {
    id: string
    height: number
    hash: Bytes
    parentHash: Bytes

    constructor(header: PartialBlockHeader) {
        this.id = formatId(header)
        this.height = header.height
        this.hash = header.hash
        this.parentHash = ''
        Object.assign(this, header)
    }
}


export class Transaction implements PartialTransaction {
    id: string
    index: number
    type?: TransactionType
    #block: BlockHeader
    #receipts?: Receipt[]
    #inputs?: Input[]
    #outputs?: Output[]

    constructor(block: BlockHeader, tx: PartialTransaction) {
        this.id = formatId(block, tx.index)
        this.index = tx.index
        this.#block = block
        Object.assign(this, tx)
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
        this.#block = value
    }

    get receipts(): Receipt[] {
        if (this.#receipts == null) {
            this.#receipts = []
        }
        return this.#receipts
    }

    set receipts(value: Receipt[]) {
        this.#receipts = value
    }

    set inputs(value: Input[]) {
        this.#inputs = value
    }

    get inputs(): Input[] {
        if (this.#inputs == null) {
            this.#inputs = []
        }
        return this.#inputs
    }

    set outputs(value: Output[]) {
        this.#outputs = value
    }

    get outputs(): Output[] {
        if (this.#outputs == null) {
            this.#outputs = []
        }
        return this.#outputs
    }
}


export class Receipt implements PartialReceipt {
    id: string
    index: number
    transactionIndex: number
    receiptType?: ReceiptType
    contract?: Bytes
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader, i: PartialReceipt) {
        this.#block = block
        this.id = formatId(block, i.transactionIndex)
        this.index = i.index
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
            throw new Error(`Transaction is not set on receipt ${this.id}`)
        } else {
            return this.#transaction
        }
    }
}


export class InputBase {
    id: string
    index: number
    transactionIndex: number
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader, src: PartialInput) {
        this.#block = block
        this.id = formatId(block, src.transactionIndex, src.index)
        this.index = src.index
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
            throw new Error(`Transaction is not set on transaction input`)
        } else {
            return this.#transaction
        }
    }
}



export class InputCoin extends InputBase {
    type: 'InputCoin' = 'InputCoin'
    utxoId?: Bytes
    owner?: Bytes
    amount?: BigInt
    assetId?: Bytes
    txPointer?: string
    witnessIndex?: number
    maturity?: number
    predicateGasUsed?: BigInt
    predicate?: Bytes
    predicateData?: Bytes
    #predicateRoot?: Bytes

    get _predicateRoot(): Bytes | undefined {
        return this.#predicateRoot
    }

    set _predicateRoot(value: Bytes | undefined) {
        this.#predicateRoot = value
    }
}


export class InputContract extends InputBase {
    type: 'InputContract' = 'InputContract'
    utxoId?: Bytes
    balanceRoot?: Bytes
    stateRoot?: Bytes
    txPointer?: string
    contract?: Bytes
}


export class InputMessage extends InputBase {
    type: 'InputMessage' = 'InputMessage'
    sender?: Bytes
    recipient?: Bytes
    amount?: BigInt
    nonce?: Bytes
    witnessIndex?: number
    predicateGasUsed?: BigInt
    data?: Bytes
    predicate?: Bytes
    predicateData?: Bytes
    #predicateRoot?: Bytes

    get _predicateRoot(): Bytes | undefined {
        return this.#predicateRoot
    }

    set _predicateRoot(value: Bytes | undefined) {
        this.#predicateRoot = value
    }
}


export type Input = InputCoin | InputContract | InputMessage


export class OutputBase {
    index: number
    transactionIndex: number
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader, src: PartialOutput) {
        this.#block = block
        this.index = src.index
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
            throw new Error(`Transaction is not set on transaction output`)
        } else {
            return this.#transaction
        }
    }
}


export class CoinOutput extends OutputBase {
    type: 'CoinOutput' = 'CoinOutput'
    to?: Bytes
    amount?: BigInt
    assetId?: Bytes
}


export class ContractOutput extends OutputBase {
    type: 'ContractOutput' = 'ContractOutput'
    inputIndex?: number
    balanceRoot?: Bytes
    stateRoot?: Bytes
}


export class ChangeOutput extends OutputBase {
    type: 'ChangeOutput' = 'ChangeOutput'
    to?: Bytes
    amount?: BigInt
    assetId?: Bytes
}


export class VariableOutput extends OutputBase {
    type: 'VariableOutput' = 'VariableOutput'
    to?: Bytes
    amount?: BigInt
    assetId?: Bytes
}


export class ContractCreated extends OutputBase {
    type: 'ContractCreated' = 'ContractCreated'
    contract?: {
        id?: Bytes
        bytecode?: Bytes
        salt?: Bytes
    }
    stateRoot?: Bytes
}


export type Output = CoinOutput | ContractOutput | ChangeOutput | VariableOutput | ContractCreated


function formatId(block: HashAndHeight, ...address: number[]): string {
    let no = block.height.toString().padStart(12, '0')
    let hash = shortHash(block.hash)
    let id = `${no}-${hash}`
    for (let index of address) {
        id += '-' + index.toString().padStart(6, '0')
    }
    return id
}
