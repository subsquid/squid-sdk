import {weakMemo} from '@subsquid/util-internal'
import {FieldSelection} from '../interfaces/data'
import {
    getBlockHeaderProps,
    getLogValidator,
    getTraceFrameValidator,
    getTxProps,
    getTxReceiptProps,
    project
} from '../mapping/schema'
import {array, BYTES, NAT, object, option, STRING, taggedUnion} from '../validation'


export type BlockValidator = typeof getBlockValidator extends ((...args: any[]) => infer T) ? T : never


export const getBlockValidator = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object(getBlockHeaderProps(fields, true))

    let Transaction = object({
        hash: fields.transaction?.hash ? BYTES : undefined,
        ...getTxProps(fields, true),
        sighash: fields.transaction?.sighash ? BYTES : undefined,
        ...getTxReceiptProps(fields, true)
    })

    let Log = getLogValidator(fields, true)

    let Trace = getTraceFrameValidator(fields, true)

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
