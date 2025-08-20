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
    l1GasMaxAmount: bigint
    l1GasMaxPricePerUnit: bigint
    l1DataGasMaxAmount: bigint | undefined
    l1DataGasMaxPricePerUnit: bigint | undefined
    l2GasMaxAmount: bigint
    l2GasMaxPricePerUnit: bigint
}

export type PriceUnit = 'WEI' | 'FRI'

export interface ActualFee {
    amount: string
    unit: PriceUnit
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
    nonce?: bigint
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