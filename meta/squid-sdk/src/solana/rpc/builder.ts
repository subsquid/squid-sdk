import {Rpc} from '@subsquid/solana-rpc'
import {DataRequest, FieldSelection} from '@subsquid/solana-stream'
import {RpcClient} from '@subsquid/rpc-client'
import {RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'

import {SolanaQueryBuilder} from '../query-builder'
import {SolanaRpcStreamDataSource} from './source/data-source'

/** JSON-RPC connection config, shared by {@link solanaRpcStream}, {@link SolanaRpcDataSourceBuilder}, and the `rpc` fallback source. */
export interface SolanaRpcOptions {
    /** JSON-RPC endpoint URL. */
    url: string
    /** Max concurrent requests. */
    capacity?: number
    /** Requests per second cap. */
    rateLimit?: number
    /** Blocks per ingestion stride. */
    strideSize?: number
    /** Concurrent strides. */
    strideConcurrency?: number
}

export interface SolanaRpcStreamConfig<F extends FieldSelection> extends SolanaRpcOptions {
    fields: F
    requests: RangeRequestList<DataRequest>
}

/**
 * Build an RPC `DataSource<Block<F>>` from a simple config. Unlike EVM there is no per-network
 * deploy-config layer to resolve: the Solana RPC surface is uniform across networks, and
 * `@subsquid/solana-normalization` produces the same block model the Portal datasets are built
 * from — so dataset parity needs no per-network preset.
 */
export function solanaRpcStream<F extends FieldSelection>(config: SolanaRpcStreamConfig<F>): SolanaRpcStreamDataSource<F> {
    const client = new RpcClient({
        url: config.url,
        capacity: config.capacity,
        rateLimit: config.rateLimit,
        // Solana RPC responses routinely carry u64 values (lamports, slots) that overflow
        // double precision — parse them exactly, as the legacy SolanaRpcClient always did.
        fixUnsafeIntegers: true,
    })

    return new SolanaRpcStreamDataSource<F>({
        rpc: new Rpc(client),
        fields: config.fields,
        requests: config.requests,
        strideSize: config.strideSize,
        strideConcurrency: config.strideConcurrency,
    })
}

/**
 * Fluent builder for a standalone JSON-RPC Solana data source — the RPC counterpart of
 * `@subsquid/solana-stream`'s `DataSourceBuilder`, with an identical query surface
 * (`setFields`/`addInstruction`/…). The only difference is `setRpc(...)` in place of
 * `setPortal(...)`. Block ranges are expressed in **slots**, matching the Portal numbering.
 *
 * @example
 * const source = new SolanaRpcDataSourceBuilder()
 *     .setRpc({url: RPC_URL})
 *     .setFields({instruction: {programId: true, data: true}})
 *     .addInstruction({where: {programId: [PROGRAM_ID]}, range: {from: 250_000_000}})
 *     .build()
 */
export class SolanaRpcDataSourceBuilder<F extends FieldSelection = {}> extends SolanaQueryBuilder {
    private options?: SolanaRpcOptions

    /**
     * Configure the JSON-RPC endpoint — a bare URL, or {@link SolanaRpcOptions} for connection
     * tuning.
     */
    setRpc(options: string | SolanaRpcOptions): this {
        this.options = typeof options === 'string' ? {url: options} : options
        return this
    }

    /** Configure the set of fetched fields — infers the block type `F` for `build()`. */
    setFields<T extends FieldSelection>(fields: T): SolanaRpcDataSourceBuilder<T> {
        this.fields = fields
        return this as unknown as SolanaRpcDataSourceBuilder<T>
    }

    /** Build the RPC data source from this builder's field selection + query. */
    build(): SolanaRpcStreamDataSource<F> {
        assert(this.options, 'RPC endpoint not set — call setRpc(...)')
        return solanaRpcStream({...this.options, fields: this.fields as F, requests: this.getRequests()})
    }
}
