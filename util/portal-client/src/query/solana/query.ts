import type {QueryBase} from '../common/query'
import type {Base58Bytes} from '../common/data'
import type {LogMessage} from './data'
import type {FieldSelection} from './fields'


export interface Query<F extends FieldSelection = FieldSelection> extends QueryBase, ItemQuery {
    type: 'solana'
    fields: F
}


export interface ItemQuery {
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


export interface InstructionRequest {
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
    preProgramId?: Base58Bytes[]
    postProgramId?: Base58Bytes[]
    preMint?: Base58Bytes[]
    postMint?: Base58Bytes[]
    preOwner?: Base58Bytes[]
    postOwner?: Base58Bytes[]
    transaction?: boolean
    transactionInstructions?: boolean
}


export interface RewardRequest {
    pubkey?: Base58Bytes[]
}
