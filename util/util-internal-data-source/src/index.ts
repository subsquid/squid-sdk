import assert from 'assert'


export interface BlockRef {
    number: number
    hash: string
}


export interface StreamRequest {
    from: number
    to?: number
    parentHash?: string
}


export interface BlockBatch<B> {
    blocks: B[]
    finalizedHead?: BlockRef
}


export type BlockStream<B> = AsyncIterable<BlockBatch<B>>


export interface DataSource<B> {
    getFinalizedHead(): Promise<BlockRef>

    getFinalizedStream(req: StreamRequest): BlockStream<B>

    getHead(): Promise<BlockRef>

    getStream(req: StreamRequest): BlockStream<B>
}


export class ForkException extends Error {
    readonly isSqdForkException = true

    constructor(
        expectedParentHash: string,
        nextBlock: BlockRef,
        public readonly prev: BlockRef[]
    ) {
        assert(prev.length > 0)
        let last = prev[prev.length - 1]
        super(`expected ${nextBlock.number}#${nextBlock.hash} to have parent ${expectedParentHash}, but got ${last.number}#${last.hash}`)
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
