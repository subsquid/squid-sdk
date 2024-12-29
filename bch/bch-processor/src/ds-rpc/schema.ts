import {weakMemo} from '@subsquid/util-internal'
import {
    array,
    NAT,
    object,
} from '@subsquid/util-internal-validation'
import {
    getBlockHeaderProps,
    getTxProps} from '../mapping/schema.js'
import {MappingRequest} from './request.js'
import {
    HEX,
} from './rpc-data.js'

// Here we must be careful to include all fields,
// that can potentially be used in item filters
// (no matter what field selection is telling us to omit)
export const getBlockValidator = weakMemo((req: MappingRequest) => {
    let Transaction = req.transactions
        ? object({
            ...getTxProps(req.fields.transaction, false),
            hash: HEX,
        })
        : HEX

    let GetBlock = object({
        ...getBlockHeaderProps(req.fields.block, false),
        transactions: array(Transaction)
    })

    return object({
        height: NAT,
        hash: HEX,
        block: GetBlock,
    })
})
