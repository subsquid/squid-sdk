import {Validator} from '@subsquid/util-internal-validation'
import type {PortalApi} from './portal-api'
import {createQueryStream as createStream, StreamOptions} from './query-stream-impl'
import {getEvmBlockSchema, patchEvmQueryFields} from './query/evm/schema'
import {getSolanaBlockSchema} from './query/solana/schema'
import type {AnyQuery, GetQueryBlock} from './query/type-getters'
import type {BlockBase, DataBatch} from './types'


export type {StreamOptions}


export function createQueryStream<Q extends AnyQuery>(
    api: PortalApi,
    query: Q,
    options?: StreamOptions
): AsyncIterable<DataBatch<GetQueryBlock<Q>>>

export function createQueryStream(
    api: PortalApi,
    query: AnyQuery,
    options?: StreamOptions
): AsyncIterable<DataBatch>
{
    let schema: Validator<BlockBase>
    switch(query.type) {
        case 'evm':
            schema = getEvmBlockSchema(query.fields ?? {})
            query = {...query}
            query.fields = patchEvmQueryFields(query.fields ?? {})
            break
        case 'solana':
            schema = getSolanaBlockSchema(query.fields)
            break
        default:
            throw new Error(`unsupported query type - ${(query as any).type}`)
    }
    return createStream(
        api,
        query,
        schema,
        options
    )
}
