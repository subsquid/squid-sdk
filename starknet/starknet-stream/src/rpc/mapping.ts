import {PartialBlock} from '../data/data-partial'
import {Block} from '@subsquid/starknet-data'
import {DataRequest} from '../data/data-request'
import {mapRpcBlock} from '@subsquid/starknet-normalization'
import {filterBlock} from './filter'
import {projectFields} from './project'


export function mapBlock(src: Block, req: DataRequest): PartialBlock {
    let block = mapRpcBlock(src)
    filterBlock(block, req)
    return projectFields(block, req.fields || {})
}