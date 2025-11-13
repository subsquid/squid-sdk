import type {Base58Bytes, QueryBase} from '../../types'
import type {LogMessage} from './data'
import type {SolanaFieldSelection} from './fields'


export interface SolanaQuery<F extends SolanaFieldSelection = SolanaFieldSelection> extends QueryBase, SolanaItemQuery {
    type: 'solana'
    fields: F
}


export interface SolanaItemQuery {
    transactions?: SolanaTransactionRequest[]
    instructions?: SolanaInstructionRequest[]
    logs?: SolanaLogRequest[]
    balances?: SolanaBalanceRequest[]
    tokenBalances?: SolanaTokenBalanceRequest[]
    rewards?: SolanaRewardRequest[]
}


export interface SolanaTransactionRequest {
    feePayer?: Base58Bytes[]
    instructions?: boolean
    logs?: boolean
}


export interface SolanaInstructionRequest {
    programId?: Base58Bytes[]
    discriminator?: string[]
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
    transaction?: boolean
    transactionBalances?: boolean
    transactionTokenBalances?: boolean
    transactionInstructions?: boolean
    logs?: boolean
    innerInstructions?: boolean
}


export interface SolanaLogRequest {
    programId?: Base58Bytes[]
    kind?: LogMessage['kind'][]
    transaction?: boolean
    instruction?: boolean
}


export interface SolanaBalanceRequest {
    account?: Base58Bytes[]
    transaction?: boolean
    transactionInstructions?: boolean
}


export interface SolanaTokenBalanceRequest {
    account?: Base58Bytes[]
    preProgramId?: Base58Bytes[]
    postProgramId?: Base58Bytes[]
    preMint?: Base58Bytes[]
    postMint?: Base58Bytes[]
    preOwner?: Base58Bytes[]
    postOwner?: Base58Bytes[]
    transaction?: boolean
    transactionInstructions?: boolean
}


export interface SolanaRewardRequest {
    pubkey?: Base58Bytes[]
}
