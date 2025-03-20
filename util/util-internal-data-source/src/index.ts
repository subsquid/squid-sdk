import assert from 'assert'
import {Range} from '@subsquid/util-internal-range'


export interface BlockRef {
    number: number
    hash: string
}


export interface DataSourceStreamOptions {
    range?: Range
    stopOnHead?: boolean
    parentHash?: string
}


export interface BlockBatch<B> {
    blocks: B[]
    finalizedHead?: BlockRef
}


export type DataSourceStream<B> = AsyncIterable<BlockBatch<B>>


export interface DataSource<B> {
    getHead(): Promise<BlockRef | undefined>

    getFinalizedHead(): Promise<BlockRef | undefined>

    // FIXME: maybe it's better to pass it ias an option to `getStream`
    getFinalizedStream(req: DataSourceStreamOptions): DataSourceStream<B>

    getStream(req: DataSourceStreamOptions): DataSourceStream<B>
}


export class ForkException extends Error {
    readonly isSqdForkException = true

    constructor(
        expectedParentHash: string,
        nextBlock: number,
        public readonly previousBlocks: BlockRef[]
    ) {
        assert(previousBlocks.length > 0)
        let last = previousBlocks[previousBlocks.length - 1]
        super(`expected ${nextBlock} to have parent ${last.number}#${expectedParentHash}, but got ${last.number}#${last.hash}`)
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
