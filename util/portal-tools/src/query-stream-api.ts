import {Validator} from '@subsquid/util-internal-validation'
import type {PortalApi} from './portal-api'
import {createQueryStream as createStream, StreamOptions} from './query-stream-impl'
import type {EvmBlock, EvmFieldSelection} from './query/evm/fields'
import type {EvmQuery} from './query/evm/query'
import {getEvmBlockSchema, patchEvmQueryFields} from './query/evm/schema'
import type {SolanaBlock, SolanaFieldSelection} from './query/solana/fields'
import type {SolanaQuery} from './query/solana/query'
import {getSolanaBlockSchema} from './query/solana/schema'
import type {BlockBase, DataBatch} from './types'


export type {StreamOptions}


export function createQueryStream<F extends EvmFieldSelection>(
    api: PortalApi,
    query: EvmQuery<F>,
    options?: StreamOptions
): AsyncIterable<DataBatch<EvmBlock<F>>>

export function createQueryStream<F extends SolanaFieldSelection>(
    api: PortalApi,
    query: SolanaQuery<F>,
    options?: StreamOptions
): AsyncIterable<DataBatch<SolanaBlock<F>>>

export function createQueryStream(
    api: PortalApi,
    query: EvmQuery | SolanaQuery,
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
