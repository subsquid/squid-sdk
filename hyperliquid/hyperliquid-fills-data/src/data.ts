import {
    object,
    array,
    STRING,
    NAT,
    nullable,
    GetSrcType,
    BYTES,
    tuple,
    oneOf,
    constant,
    option,
    STRING_FLOAT,
    BOOLEAN
} from '@subsquid/util-internal-validation'


export const Fill = object({
    coin: STRING,
    px: STRING_FLOAT,
    sz: STRING_FLOAT,
    side: oneOf({
        bid: constant('B'),
        ask: constant('A')
    }),
    time: NAT,
    startPosition: STRING_FLOAT,
    dir: STRING,
    closedPnl: STRING_FLOAT,
    hash: BYTES,
    oid: NAT,
    crossed: BOOLEAN,
    fee: STRING_FLOAT,
    builderFee: option(STRING_FLOAT),
    tid: NAT,
    cloid: option(BYTES),
    feeToken: STRING,
    builder: option(BYTES),
    twapId: nullable(NAT)
})


export type Fill = GetSrcType<typeof Fill>


export const Event = tuple(BYTES, Fill)


export type Event = GetSrcType<typeof Event>


export const Block = object({
    local_time: STRING,
    block_time: STRING,
    block_number: NAT,
    events: array(Event)
})


export type Block = GetSrcType<typeof Block>
