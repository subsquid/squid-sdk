import {unexpectedCase} from '@subsquid/util-internal'
import * as evm from './evm'
import * as solana from './solana'
import * as substrate from './substrate'
import * as tron from './tron'

export {evm, solana, substrate, tron}

export type GetQueryBlock<Q> = Q extends evm.Query<infer F>
    ? evm.Block<F>
    : Q extends solana.Query<infer F>
    ? solana.Block<F>
    : Q extends substrate.Query<infer F>
    ? substrate.Block<F>
    : Q extends tron.Query<infer F>
    ? tron.Block<F>
    : never

export type AnyQuery = evm.Query | solana.Query | substrate.Query | tron.Query

export function getQuery<Q extends AnyQuery>(query: Q) {
    query = {...query}
    switch (query.type) {
        case 'evm':
            query.fields = evm.patchQueryFields(query.fields ?? {})
            return [query, evm.getBlockSchema(query.fields)] as const
        case 'solana':
            query.fields = solana.patchQueryFields(query.fields ?? {})
            return [query, solana.getBlockSchema(query.fields)] as const
        case 'substrate':
            query.fields = substrate.patchQueryFields(query.fields ?? {})
            return [query, substrate.getBlockSchema(query.fields)] as const
        case 'tron':
            query.fields = tron.patchQueryFields(query.fields ?? {})
            return [query, tron.getBlockSchema(query.fields)] as const
        default:
            throw unexpectedCase((query as any).type)
    }
}
