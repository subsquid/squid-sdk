import {RangeRequestList} from '@subsquid/util-internal-range'
import {HashAndHeight, HotDatabaseState} from './database'


export interface BlockHeader {
    height: number
    hash: string
    parentHash: string
}


export interface Block {
    header: BlockHeader
}


export interface Batch<B> {
    blocks: B[]
    isHead: boolean
}


export interface HotUpdate<B> {
    blocks: B[]
    baseHead: HashAndHeight
    finalizedHead: HashAndHeight
}


export interface DataSource<B, R> {
    getFinalizedBlocks(requests: RangeRequestList<R>, stopOnHead?: boolean): AsyncIterable<Batch<B>>
    getFinalizedHeight(): Promise<number>
    getBlockHash(height: number): Promise<string | null | undefined>
}


export interface HotDataSource<B, R> extends DataSource<B, R> {
    processHotBlocks(
        requests: RangeRequestList<R>,
        state: HotDatabaseState,
        cb: (upd: HotUpdate<B>) => Promise<void>
    ): Promise<void>
}
