import {mapRpcBlock} from '@subsquid/solana-normalization'
import type * as rpc from '@subsquid/solana-rpc-data'
import {PartialBlock} from '../data/partial'
import {DataRequest} from '../data/request'
import {filterBlockItems} from './filter'
import {projectFields} from './project'


export function mapBlock(src: rpc.Block, req: DataRequest): PartialBlock {
    let block = mapRpcBlock(src)
    filterBlockItems(block, req)
    return projectFields(block, req.fields || {})
}
