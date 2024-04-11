type Bytes = string


export interface BlockHeader {
    hash: Bytes
    height: number
    daHeight: BigInt
    transactionsRoot: Bytes
    transactionsCount: BigInt
    messageReceiptRoot: Bytes
    messageReceiptCount: BigInt
    prevRoot: Bytes
    time: BigInt
    applicationHash: Bytes
}


export interface Policies {
    gasPrice?: BigInt
    witnessLimit?: BigInt
    maturity?: number
    maxFee?: BigInt
}


export interface ProgramState {
    returnType: 'RETURN' | 'RETURN_DATA' | 'REVERT'
    data: Bytes
}


export interface SubmittedStatus {
    type: 'SubmittedStatus'
    time: BigInt
}


export interface SuccessStatus {
    type: 'SuccessStatus'
    transactionId: Bytes
    time: BigInt
    programState?: ProgramState
}


export interface SqueezedOutStatus {
    type: 'SqueezedOutStatus'
    reason: string
}


export interface FailureStatus {
    type: 'FailureStatus'
    transactionId: Bytes
    time: BigInt
    reason: string
    programState?: ProgramState
}


export type Status = SubmittedStatus | SuccessStatus | SqueezedOutStatus | FailureStatus


export type TransactionType = 'Script' | 'Create' | 'Mint'


export interface Transaction {
    index: number
    hash: Bytes
    inputAssetIds?: Bytes[]
    inputContracts?: Bytes[]
    inputContract?: {
        utxoId: Bytes
        balanceRoot: Bytes
        stateRoot: Bytes
        txPointer: string
        contract: Bytes
    }
    policies?: Policies
    gasPrice?: BigInt
    scriptGasLimit?: BigInt
    maturity?: number
    mintAmount?: BigInt
    mintAssetId?: Bytes
    txPointer?: string
    isScript: boolean
    isCreate: boolean
    isMint: boolean
    type: TransactionType
    outputContract?: {
        inputIndex: number
        balanceRoot: Bytes
        stateRoot: Bytes
    }
    witnesses?: Bytes[]
    receiptsRoot?: Bytes
    status: Status
    script?: Bytes
    scriptData?: Bytes
    bytecodeWitnessIndex?: number
    bytecodeLength?: BigInt
    salt?: Bytes
    storageSlots?: Bytes[]
    rawPayload?: Bytes
}


export interface InputCoin {
    type: 'InputCoin'
    index: number
    transactionIndex: number
    utxoId: Bytes
    owner: Bytes
    amount: BigInt
    assetId: Bytes
    txPointer: string
    witnessIndex: number
    maturity: number
    predicateGasUsed: BigInt
    predicate: Bytes
    predicateData: Bytes
}


export interface InputContract {
    type: 'InputContract'
    index: number
    transactionIndex: number
    utxoId: Bytes
    balanceRoot: Bytes
    stateRoot: Bytes
    txPointer: string
    contract: Bytes
}


export interface InputMessage {
    type: 'InputMessage'
    index: number
    transactionIndex: number
    sender: Bytes
    recipient: Bytes
    amount: BigInt
    nonce: Bytes
    witnessIndex: number
    predicateGasUsed: BigInt
    data: Bytes
    predicate: Bytes
    predicateData: Bytes
}


export type TransactionInput = InputCoin | InputContract | InputMessage


export interface CoinOutput {
    type: 'CoinOutput'
    index: number
    transactionIndex: number
    to: Bytes
    amount: BigInt
    assetId: Bytes
}


export interface ContractOutput {
    type: 'ContractOutput'
    index: number
    transactionIndex: number
    inputIndex: number
    balanceRoot: Bytes
    stateRoot: Bytes
}


export interface ChangeOutput {
    type: 'ChangeOutput'
    index: number
    transactionIndex: number
    to: Bytes
    amount: BigInt
    assetId: Bytes
}


export interface VariableOutput {
    type: 'VariableOutput'
    index: number
    transactionIndex: number
    to: Bytes
    amount: BigInt
    assetId: Bytes
}


export interface ContractCreated {
    type: 'ContractCreated'
    index: number
    transactionIndex: number
    contract: {
        id: Bytes
        bytecode: Bytes
        salt: Bytes
    }
    stateRoot: Bytes
}


export type TransactionOutput = CoinOutput | ContractOutput | ChangeOutput | VariableOutput | ContractCreated


export type ReceiptType = 'CALL' | 'RETURN' | 'RETURN_DATA' | 'PANIC' | 'REVERT' | 'LOG' | 'LOG_DATA' | 'TRANSFER' | 'TRANSFER_OUT' | 'SCRIPT_RESULT' | 'MESSAGE_OUT' | 'MINT' | 'BURN'


export interface Receipt {
    index: number
    transactionIndex: number
    contract?: Bytes
    pc?: BigInt
    is?: BigInt
    to?: Bytes
    toAddress?: Bytes
    amount?: BigInt
    assetId?: Bytes
    gas?: BigInt
    param1?: BigInt
    param2?: BigInt
    val?: BigInt
    ptr?: BigInt
    digest?: Bytes
    reason?: BigInt
    ra?: BigInt
    rb?: BigInt
    rc?: BigInt
    rd?: BigInt
    len?: BigInt
    receiptType: ReceiptType
    result?: BigInt
    gasUsed?: BigInt
    data?: Bytes
    sender?: Bytes
    recipient?: Bytes
    nonce?: Bytes
    contractId?: Bytes
    subId?: Bytes
}


export interface Block {
    header: BlockHeader
    transactions: Transaction[]
    inputs: TransactionInput[]
    outputs: TransactionOutput[]
    receipts: Receipt[]
}
