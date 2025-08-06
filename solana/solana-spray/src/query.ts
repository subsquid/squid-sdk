import {Base58Bytes} from './data/data'


export interface TransactionRequest {
    where?: TransactionRequestWhere
    include?: TransactionRequestRelations
}


export interface TransactionRequestWhere {
    feePayer?: Base58Bytes[]
    mentionsAccount?: Base58Bytes[]
}


export interface TransactionRequestRelations {
    instructions?: boolean
    logs?: boolean
}


/**
 * Hex encoded prefix of instruction data
 */
export type Discriminator = string


export interface InstructionRequest {
    where?: InstructionRequestWhere
    include?: InstructionRequestRelations
}


export interface InstructionRequestWhere {
    programId?: Base58Bytes[]
    discriminator?: Discriminator[]
    mentionsAccount?: Base58Bytes[]
    a0?: Base58Bytes[]
    a1?: Base58Bytes[]
    a2?: Base58Bytes[]
    a3?: Base58Bytes[]
    a4?: Base58Bytes[]
    a5?: Base58Bytes[]
    a6?: Base58Bytes[]
    a7?: Base58Bytes[]
    a8?: Base58Bytes[]
    a9?: Base58Bytes[]
    a10?: Base58Bytes[]
    a11?: Base58Bytes[]
    a12?: Base58Bytes[]
    a13?: Base58Bytes[]
    a14?: Base58Bytes[]
    a15?: Base58Bytes[]
    isCommitted?: boolean
}


export interface InstructionRequestRelations {
    transaction?: boolean
    transactionBalances?: boolean
    transactionTokenBalances?: boolean
    transactionInstructions?: boolean
    innerInstructions?: boolean
}


export interface BalanceRequest {
    where?: BalanceRequestWhere
    include?: BalanceRequestRelations
}


export interface BalanceRequestWhere {
    account?: Base58Bytes[]
}


export interface BalanceRequestRelations {
    transaction?: boolean
    transactionInstructions?: boolean
}


export interface TokenBalanceRequest {
    where?: TokenBalanceRequestWhere
    include?: TokenBalanceRequestRelations
}


export interface TokenBalanceRequestWhere {
    account?: Base58Bytes[]
    preProgramId?: Base58Bytes[]
    postProgramId?: Base58Bytes[]
    preMint?: Base58Bytes[]
    postMint?: Base58Bytes[]
    preOwner?: Base58Bytes[]
    postOwner?: Base58Bytes[]
}


export interface TokenBalanceRequestRelations {
    transaction?: boolean
    transactionInstructions?: boolean
}


export interface Query<F = {}> {
    fields?: F
    includeAllBlocks?: boolean
    transactions?: TransactionRequest[]
    instructions?: InstructionRequest[]
    balances?: BalanceRequest[]
    tokenBalances?: TokenBalanceRequest[]
}
