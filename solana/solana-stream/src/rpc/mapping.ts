import {mapRpcBlock} from '@subsquid/solana-normalization'
import type * as rpc from '@subsquid/solana-rpc-data'
import {PartialBlock} from '../data/partial'
import {DataRequest} from '../data/request'
import {filterBlockItems} from './filter'
import {projectFields} from './project'
import {addErrorContext} from '@subsquid/util-internal'

const failingJournal = {
    warn: function(props: any, msg: string): void {
        throw addErrorContext(new Error(msg), props)
    },
    error: function(props: any, msg: string): void {
        throw addErrorContext(new Error(msg), props)
    }
}

export function mapBlock(src: rpc.Block, req: DataRequest): PartialBlock {
    let block = mapRpcBlock(src, failingJournal)
    filterBlockItems(block, req)
    return projectFields(block, req.fields || {})
}
