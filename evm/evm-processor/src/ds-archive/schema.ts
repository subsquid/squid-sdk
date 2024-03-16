import {weakMemo} from '@subsquid/util-internal'
import {
    array,
    BYTES,
    NAT,
    object,
    option,
    STRING,
    taggedUnion,
    withDefault,
    withSentinel
} from '@subsquid/util-internal-validation'
import * as schema from '@subsquid/evm-data/lib/schema'
import {FieldSelection} from '../interfaces/data'
import {getTraceFrameValidator, project, getLogValidator} from '../mapping/schema'


export const getBlockValidator = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object({
        ...project(fields.block, {
            ...schema.GetBlock.props,
            timestamp: withSentinel('BlockHeader.timestamp', 0, NAT),
            size: withSentinel('BlockHeader.size', -1, NAT),
            l1BlockNumber: withDefault(0, NAT),
        }),
        number: NAT,
        hash: BYTES,
        parentHash: BYTES,
    })

    let Transaction = object({
        ...project(fields.transaction, {
            ...schema.Transaction.props,
            ...schema.TransactionReceipt.props,
            nonce: withSentinel('Transaction.nonce', -1, NAT),
            yParity: option(NAT),
            chainId: option(NAT),
            type: withSentinel('Receipt.type', -1, NAT),
            status: withSentinel('Receipt.status', -1, NAT),
        }),
        transactionIndex: NAT,
    })

    let Log = getLogValidator(fields.log, true)

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
