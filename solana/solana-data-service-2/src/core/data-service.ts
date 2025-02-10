import {DataBatch, StreamRequest} from './data-source'
import {Block, BlockHeader, BlockRef, InvalidBaseBlock} from './types'


export interface DataResponse {
    finalizedHead: BlockRef
    headStream?: AsyncIterable<Block[]>
    blocks: Block[]
}


export class DataService {
    async query(fromBlock: number, parentHash?: string): Promise<DataResponse | InvalidBaseBlock> {
        throw new Error('not implemented')
    }
}


export interface DataSource<B extends BlockHeader> {
    getFinalizedHead(): Promise<BlockRef>

    finalizedStream(req: StreamRequest): AsyncIterable<DataBatch<B>>

    stream(req: StreamRequest): AsyncIterable<DataBatch<B>>
}
