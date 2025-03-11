import {Base58Bytes} from '@subsquid/solana-rpc'
import {LogMessage} from '@subsquid/solana-normalization'
import {FieldSelection} from './model'


export interface DataRequest {
    fields?: FieldSelection
    includeAllBlocks?: boolean
    transactions?: TransactionRequest[]
    instructions?: InstructionRequest[]
    logs?: LogRequest[]
    balances?: BalanceRequest[]
    tokenBalances?: TokenBalanceRequest[]
    rewards?: RewardRequest[]
}


export interface TransactionRequest {
    where?: TransactionRequestWhere
    include?: TransactionRequestRelations
}


export interface TransactionRequestWhere {
    feePayer?: Base58Bytes[]
}


export interface TransactionRequestRelations {
    instructions?: boolean
    logs?: boolean
    balances?: boolean
    tokenBalances?: boolean
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
    d1?: Discriminator[]
    d2?: Discriminator[]
    d3?: Discriminator[]
    d4?: Discriminator[]
    d8?: Discriminator[]
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
    isCommitted?: boolean
}


export interface InstructionRequestRelations {
    transaction?: boolean
    transactionBalances?: boolean
    transactionTokenBalances?: boolean
    transactionInstructions?: boolean
    logs?: boolean
    innerInstructions?: boolean
}


export interface LogRequest {
    where?: LogRequestWhere
    include?: LogRequestRelations
}


export interface LogRequestWhere {
    programId?: Base58Bytes[]
    kind?: LogMessage['kind'][]
}


export interface LogRequestRelations {
    transaction?: boolean
    instruction?: boolean
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


export interface RewardRequest {
    where?: {
        pubkey?: Base58Bytes[]
    }
    include?: undefined
}
