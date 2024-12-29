import {weakMemo} from '@subsquid/util-internal'
import {array, BYTES, object, option} from '@subsquid/util-internal-validation'
import {FieldSelection} from '../interfaces/data.js'
import {
    getBlockHeaderProps,
    getTxProps,
} from '../mapping/schema.js'


export const getBlockValidator = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object(getBlockHeaderProps(fields.block, true))

    let Transaction = object({
        hash: fields.transaction?.hash ? BYTES : undefined,
        ...getTxProps(fields.transaction, true),
    })

    return object({
        header: BlockHeader,
        transactions: option(array(Transaction)),
    })
})
