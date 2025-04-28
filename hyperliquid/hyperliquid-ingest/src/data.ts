import {
    object,
    array,
    STRING,
    NAT,
    nullable,
    GetSrcType,
    ANY_OBJECT
} from '@subsquid/util-internal-validation'


export const RawHeader = object({
    block_time: STRING,
    height: NAT,
    hash: STRING,
    proposer: STRING
})


export type RawHeader = GetSrcType<typeof RawHeader>


export const RawTransaction = object({
    actions: array(ANY_OBJECT),
    user: STRING,
    raw_tx_hash: nullable(STRING),
    error: nullable(STRING)
})


export type RawTransaction = GetSrcType<typeof RawTransaction>


export const RawBlock = object({
    header: RawHeader,
    txs: array(RawTransaction)
})


export type RawBlock = GetSrcType<typeof RawBlock>
