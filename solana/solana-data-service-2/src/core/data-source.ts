import {last} from '@subsquid/util-internal'
import assert from 'assert'
import {BlockHeader, BlockRef} from './types'


export interface StreamRequest {
    from: number
    to?: number
    parentHash?: string
}


export interface DataBatch<B> {
    blocks: B[]
    finalizedHead?: BlockRef
}


export interface DataSource<B extends BlockHeader> {
    getFinalizedHead(): Promise<BlockRef>

    finalizedStream(req: StreamRequest): AsyncIterable<DataBatch<B>>

    stream(req: StreamRequest): AsyncIterable<DataBatch<B>>
}


export class ForkException extends Error {
    public readonly isSqdForkException = true

    constructor(public readonly prev: BlockRef[]) {
        assert(prev.length > 0)
        super(`fork detected at ${last(prev).number}#${last(prev).hash}`)
    }
}
