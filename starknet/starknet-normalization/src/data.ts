type FELT = string
type STD_HASH = FELT

export interface BlockHeader {
    hash: FELT
    height: number
    parentHash: FELT
    status: string
    newRoot: FELT
    timestamp: number
    sequencerAddress: FELT
}

export interface ResourceBounds {
    l1GasMaxAmount: number
    l1GasMaxPricePerUnit: number
    l2GasMaxAmount: number
    l2GasMaxPricePerUnit: number
}

export interface ActualFee {
    amount: string
    unit: string
}

export type TransactionType = 'INVOKE' | 'DECLARE' | 'DEPLOY_ACCOUNT' | 'DEPLOY' | 'L1_HANDLER'

export interface Transaction {
    transactionIndex: number
    transactionHash: FELT
    contractAddress?: FELT
    entryPointSelector?: FELT
    calldata?: FELT[]
    maxFee?: FELT
    type: TransactionType
    senderAddress?: FELT
    version: string
    signature?: FELT[]
    nonce?: number
    classHash?: FELT
    compiledClassHash?: FELT
    contractAddressSalt?: FELT
    constructorCalldata?: FELT[]
    resourceBounds?: ResourceBounds
    tip?: FELT
    paymasterData?: FELT[]
    accountDeploymentData?: FELT[]
    nonceDataAvailabilityMode?: string
    feeDataAvailabilityMode?: string
    messageHash?: STD_HASH
    actualFee: ActualFee
    finalityStatus: string
}

export interface Event {
    transactionIndex: number
    eventIndex: number
    fromAddress: FELT
    keys: FELT[]
    data: FELT[]
}

export interface Block {
    header: BlockHeader
    transactions: Transaction[]
    events: Event[]
}