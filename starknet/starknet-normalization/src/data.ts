type FELT = string

export interface BlockHeader {
    hash: FELT
    height: number
    parentHash: FELT
    status: string
    newRoot: FELT
    timestamp: number
    sequencerAddress: FELT
    starknetVersion: string
    l1GasPriceInFri: FELT
    l1GasPriceInWei: FELT
}

export type TransactionType = 'INVOKE' | 'DECLARE' | 'DEPLOY_ACCOUNT' | 'DEPLOY'

export interface Transaction {
    blockNumber: number
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
}

export interface Event {
    blockNumber: number
    transactionIndex: number
    eventIndex: number
    fromAddress: FELT
    key0?: FELT
    key1?: FELT
    key2?: FELT
    key3?: FELT
    restKeys?: FELT[]
    data: FELT[]
    keysSize: number
}
