import assert from 'assert'
import {Range} from '@subsquid/util-internal-range'


export interface BlockRef {
    number: number
    hash: string
}


export interface DataSourceStreamOptions {
    after?: BlockRef
    stopOnHead?: boolean
}


export interface BlockBatch<B> {
    blocks: B[]
    finalizedHead?: BlockRef
}


export interface DataSource<B> {
    getHead(): Promise<BlockRef | undefined>

    getFinalizedHead(): Promise<BlockRef | undefined>

    // FIXME: maybe it's better to pass it ias an option to `getStream`
    getFinalizedStream(req: DataSourceStreamOptions): AsyncIterable<BlockBatch<B>>

    getStream(req: DataSourceStreamOptions): AsyncIterable<BlockBatch<B>>
}


export class ForkException extends Error {
    readonly isSqdForkException = true

    constructor(
        blockNumber: number,
        parentBlockHash: string,
        public readonly previousBlocks: BlockRef[]
    ) {
        assert(previousBlocks.length > 0)
        let last = previousBlocks[previousBlocks.length - 1]
        super(`expected ${blockNumber} to have parent ${last.number}#${parentBlockHash}, but got ${last.number}#${last.hash}`)
    }

    get name(): string {
        return 'ForkException'
    }
}


export function isForkException(err: unknown): err is ForkException {
    return err instanceof Error && !!(err as any).isSqdForkException
}


export class DataConsistencyError extends Error {
    readonly isSqdDataConsistencyError = true
}


export class BlockConsistencyError extends DataConsistencyError {
    constructor(ref: BlockRef, errorMsg?: string) {
        let msg = `Failed to fetch block ${ref.number}#${ref.hash}`
        if (errorMsg) {
            msg += ': ' + errorMsg
        }
        super(msg)
    }
}


export function isDataConsistencyError(err: unknown): err is Error {
    return err instanceof Error && !!(err as any).isSqdDataConsistencyError
}
