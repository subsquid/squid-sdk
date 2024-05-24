export type Bytes = string


export interface BlockHeader {
    hash: Bytes
    height: number
    daHeight: bigint
    transactionsRoot: Bytes
    transactionsCount: number
    messageReceiptCount: number
    prevRoot: Bytes
    time: bigint
    applicationHash: Bytes
    eventInboxRoot: Bytes
    consensusParametersVersion: number
    stateTransitionBytecodeVersion: number
    messageOutboxRoot: Bytes
}


export interface Policies {
    tip?: bigint
    witnessLimit?: bigint
    maturity?: number
    maxFee?: bigint
}


export interface ProgramState {
    returnType: 'RETURN' | 'RETURN_DATA' | 'REVERT'
    data: Bytes
}


export interface SubmittedStatus {
    type: 'SubmittedStatus'
    time: bigint
}


export interface SuccessStatus {
    type: 'SuccessStatus'
    transactionId: Bytes
    time: bigint
    programState?: ProgramState
    totalGas: bigint
    totalFee: bigint
}


export interface SqueezedOutStatus {
    type: 'SqueezedOutStatus'
    reason: string
}


export interface FailureStatus {
    type: 'FailureStatus'
    transactionId: Bytes
    time: bigint
    reason: string
    programState?: ProgramState
    totalGas: bigint
    totalFee: bigint
}


export type Status = SubmittedStatus | SuccessStatus | SqueezedOutStatus | FailureStatus


export type TransactionType = 'Script' | 'Create' | 'Mint' | 'Upgrade' | 'Upload'


export interface ConsensusParametersPurpose {
    type: 'ConsensusParametersPurpose'
    witnessIndex: number
    checksum: Bytes
}


export interface StateTransitionPurpose {
    type: 'StateTransitionPurpose'
    root: Bytes
}


export type UpgradePurpose = ConsensusParametersPurpose | StateTransitionPurpose


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
        contractId: Bytes
    }
    policies?: Policies
    scriptGasLimit?: bigint
    maturity?: number
    mintAmount?: bigint
    mintAssetId?: Bytes
    mintGasPrice?: bigint
    txPointer?: string
    isScript: boolean
    isCreate: boolean
    isMint: boolean
    isUpgrade: boolean
    isUpload: boolean
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
    salt?: Bytes
    storageSlots?: Bytes[]
    rawPayload?: Bytes
    bytecodeWitnessIndex?: number
    bytecodeRoot?: Bytes
    subsectionIndex?: number
    subsectionsNumber?: number
    proofSet?: Bytes[]
    upgradePurpose?: UpgradePurpose
}


export interface InputCoin {
    type: 'InputCoin'
    index: number
    transactionIndex: number
    utxoId: Bytes
    owner: Bytes
    amount: bigint
    assetId: Bytes
    txPointer: string
    witnessIndex: number
    predicateGasUsed: bigint
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
    contractId: Bytes
}


export interface InputMessage {
    type: 'InputMessage'
    index: number
    transactionIndex: number
    sender: Bytes
    recipient: Bytes
    amount: bigint
    nonce: Bytes
    witnessIndex: number
    predicateGasUsed: bigint
    data: Bytes
    predicate: Bytes
    predicateData: Bytes
}


export type InputType = 'InputCoin' | 'InputContract' | 'InputMessage'


export type TransactionInput = InputCoin | InputContract | InputMessage


export interface CoinOutput {
    type: 'CoinOutput'
    index: number
    transactionIndex: number
    to: Bytes
    amount: bigint
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
    amount: bigint
    assetId: Bytes
}


export interface VariableOutput {
    type: 'VariableOutput'
    index: number
    transactionIndex: number
    to: Bytes
    amount: bigint
    assetId: Bytes
}


export interface ContractCreated {
    type: 'ContractCreated'
    index: number
    transactionIndex: number
    contract: Bytes
    stateRoot: Bytes
}


export type OutputType = 'CoinOutput' | 'ContractOutput' | 'ChangeOutput' | 'VariableOutput' | 'ContractCreated'


export type TransactionOutput = CoinOutput | ContractOutput | ChangeOutput | VariableOutput | ContractCreated


export type ReceiptType = 'CALL' | 'RETURN' | 'RETURN_DATA' | 'PANIC' | 'REVERT' | 'LOG' | 'LOG_DATA' | 'TRANSFER' | 'TRANSFER_OUT' | 'SCRIPT_RESULT' | 'MESSAGE_OUT' | 'MINT' | 'BURN'


export interface Receipt {
    index: number
    transactionIndex: number
    /** this field matches to `Receipt.id` field in GraphQL api */
    contract?: Bytes
    pc?: bigint
    is?: bigint
    to?: Bytes
    toAddress?: Bytes
    amount?: bigint
    assetId?: Bytes
    gas?: bigint
    param1?: bigint
    param2?: bigint
    val?: bigint
    ptr?: bigint
    digest?: Bytes
    reason?: bigint
    ra?: bigint
    rb?: bigint
    rc?: bigint
    rd?: bigint
    len?: bigint
    receiptType: ReceiptType
    result?: bigint
    gasUsed?: bigint
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
