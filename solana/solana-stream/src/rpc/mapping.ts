import {mapRpcBlock} from '@subsquid/solana-normalization'
import type * as rpc from '@subsquid/solana-rpc-data'
import {PartialBlock} from '../data/partial'
import {DataRequest} from '../data/request'
import {filterBlockItems} from './filter'
import {projectFields} from './project'
import {createLogger} from '@subsquid/logger'

const logger = createLogger('sqd:solana-normalization')

export function mapBlock(src: rpc.Block, req: DataRequest, ): PartialBlock {
    let block = mapRpcBlock(src, logger)
    filterBlockItems(block, req)
    return projectFields(block, req.fields || {})
}
