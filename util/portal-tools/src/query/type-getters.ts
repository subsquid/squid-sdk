import type {EvmBlock} from './evm/fields'
import type {EvmQuery} from './evm/query'
import type {SolanaBlock} from './solana/fields'
import type {SolanaQuery} from './solana/query'


export type GetTransaction<B> = B extends {transactions?: (infer T)[]} ? T : never
export type GetLog<B> = B extends {logs?: (infer T)[]} ? T : never
export type GetTrace<B> = B extends {traces?: (infer T)[]} ? T : never
export type GetStateDiff<B> = B extends {stateDiffs?: (infer T)[]} ? T : never
export type GetInstruction<B> = B extends {instructions?: (infer T)[]} ? T : never
export type GetBalance<B> = B extends {balances?: (infer T)[]} ? T : never
export type GetTokenBalance<B> = B extends {tokenBalances?: (infer T)[]} ? T : never
export type GetReward<B> = B extends {reward?: (infer T)[]} ? T : never


export type GetQueryBlock<Q> =
    Q extends EvmQuery<infer F>
        ? EvmBlock<F>
        : Q extends SolanaQuery<infer F>
            ? SolanaBlock<F>
            : never


export type AnyQuery = EvmQuery | SolanaQuery
