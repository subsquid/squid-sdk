import {weakMemo} from '@subsquid/util-internal'
import {array, BYTES, NAT, object, option, STRING, taggedUnion, withDefault} from '@subsquid/util-internal-validation'
import {FieldSelection} from '../interfaces/data'
import {
    getBlockHeaderProps,
    getLogProps,
    getTraceFrameValidator,
    getTxProps,
    getTxReceiptProps,
    project
} from '../mapping/schema'


export const getBlockValidator = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object(getBlockHeaderProps(fields.block, true))

    let Transaction = object({
        hash: fields.transaction?.hash ? BYTES : undefined,
        ...getTxProps(fields.transaction, true),
        sighash: fields.transaction?.sighash ? withDefault('0x', BYTES) : undefined,
        ...getTxReceiptProps(fields.transaction, true)
    })

    let Log = object(
        getLogProps(fields.log, true)
    )

    let Trace = getTraceFrameValidator(fields.trace, true)

    let stateDiffBase = {
        transactionIndex: NAT,
        address: BYTES,
        key: STRING
    }

    let StateDiff = taggedUnion('kind', {
        ['=']: object({...stateDiffBase}),
        ['+']: object({...stateDiffBase, ...project(fields.stateDiff, {next: BYTES})}),
        ['*']: object({...stateDiffBase, ...project(fields.stateDiff, {prev: BYTES, next: BYTES})}),
        ['-']: object({...stateDiffBase, ...project(fields.stateDiff, {prev: BYTES})})
    })

    return object({
        header: BlockHeader,
        transactions: option(array(Transaction)),
        logs: option(array(Log)),
        traces: option(array(Trace)),
        stateDiffs: option(array(StateDiff))
    })
})
