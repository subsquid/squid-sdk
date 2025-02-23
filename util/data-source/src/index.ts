import {FiniteRange, Range} from '@subsquid/util-internal-range'

export type BlockRef = {
    number: number
    hash: string
}

export interface DataSourceStreamData<B> {
    blocks: B[]
    finalizedHead?: BlockRef
}

export type DataSourceStream<B> = ReadableStream<DataSourceStreamData<B>>

export interface DataSourceStreamOptions {
    range?: Range
    stopOnHead?: boolean
    parentBlockHash?: string
}

export interface DataSource<B> {
    getHead(): Promise<BlockRef | undefined>
    getFinalizedHead(): Promise<BlockRef | undefined>
    getStream(opts?: DataSourceStreamOptions): AsyncIterable<DataSourceStreamData<B>>
}

export type GetDataSourceBlock<T> = T extends DataSource<infer B> ? B : never

export class DataSourceForkError extends Error {
    readonly name = "ForkError"
    constructor(readonly lastBlocks: BlockRef[]) {
        // TODO: better text
        super('Fork detected')
    }
}