type Bytes = string


export interface BlockHeader {
    id: Bytes
    height: number
    daHeight: number
    transactionsRoot: Bytes
    transactionsCount: number
    messageReceiptRoot: Bytes
    messageReceiptCount: number
    prevRoot: Bytes
    time: number
    applicationHash: Bytes
}


export interface Policies {
    gasPrice?: number
    witnessLimit?: number
    maturity?: number
    maxFee?: number
}


export interface ProgramState {
    returnType: 'RETURN' | 'RETURN_DATA' | 'REVERT'
    data: Bytes
}


export interface SubmittedStatus {
    type: 'SubmittedStatus'
    time: number
}


export interface SuccessStatus {
    type: 'SuccessStatus'
    transactionId: Bytes
    time: number
    programState?: ProgramState
}


export interface SqueezedOutStatus {
    type: 'SqueezedOutStatus'
    reason: string
}


export interface FailureStatus {
    type: 'FailureStatus'
    transactionId: Bytes
    time: number
    reason: string
    programState?: ProgramState
}


export type Status = SubmittedStatus | SuccessStatus | SqueezedOutStatus | FailureStatus


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
    gasPrice?: number
    scriptGasLimit?: number
    maturity?: number
    mintAmount?: number
    mintAssetId?: Bytes
    txPointer?: string
    isScript: boolean
    isCreate: boolean
    isMint: boolean
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
    bytecodeLength?: number
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
    amount: number
    assetId: Bytes
    txPointer: string
    witnessIndex: number
    maturity: number
    predicateGasUsed: number
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
    amount: number
    nonce: Bytes
    witnessIndex: number
    predicateGasUsed: number
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
    amount: number
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
    amount: number
    assetId: Bytes
}


export interface VariableOutput {
    type: 'VariableOutput'
    index: number
    transactionIndex: number
    to: Bytes
    amount: number
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
    pc?: number
    is?: number
    to?: Bytes
    toAddress?: Bytes
    amount?: number
    assetId?: Bytes
    gas?: number
    param1?: number
    param2?: number
    val?: number
    ptr?: number
    digest?: Bytes
    reason?: number
    ra?: number
    rb?: number
    rc?: number
    rd?: number
    len?: number
    receiptType: ReceiptType
    result?: number
    gasUsed?: number
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
