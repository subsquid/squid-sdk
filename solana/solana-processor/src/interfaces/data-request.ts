import {Base58Bytes} from '@subsquid/solana-data'
import {LogMessage} from '@subsquid/solana-data/lib/normalization'
import {FieldSelection} from './data'


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
    feePayer?: Base58Bytes[]
    instructions?: boolean
    logs?: boolean
}


/**
 * Hex encoded prefix of instruction data
 */
export type Discriminator = string


export interface InstructionRequest {
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
    transaction?: boolean
    transactionTokenBalances?: boolean
    logs?: boolean
    innerInstructions?: boolean
}


export interface LogRequest {
    programId?: Base58Bytes[]
    kind?: LogMessage['kind'][]
    transaction?: boolean
    instruction?: boolean
}


export interface BalanceRequest {
    account?: Base58Bytes[]
    transaction?: boolean
    transactionInstructions?: boolean
}


export interface TokenBalanceRequest {
    account?: Base58Bytes[]
    mint?: Base58Bytes[]
    owner?: Base58Bytes[]
    programId?: Base58Bytes[]
    transaction?: boolean
    transactionInstructions?: boolean
}


export interface RewardRequest {
    pubkey?: Base58Bytes[]
}
