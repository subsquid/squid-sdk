import assert from 'assert'
import * as raw from './data'


export type Bytes = string


export interface Fill {
    fillIndex: number
    user: Bytes
    coin: string
    px: number
    sz: number
    side: 'B' | 'A'
    time: number
    startPosition: number
    dir: string
    closedPnl: number
    hash: Bytes
    oid: number
    crossed: boolean
    fee: number
    builderFee?: number
    tid: number
    cloid?: Bytes
    feeToken: string
    builder?: Bytes
    twapId?: number
}


export interface BlockHeader {
    number: number
    hash: Bytes
    parentHash: Bytes
    timestamp: number
}


export interface Block {
    header: BlockHeader
    fills: Fill[]
}


function mapRawFill(user: string, fill: raw.Fill, fillIndex: number) {
    return {
        fillIndex,
        user,
        coin: fill.coin,
        px: toFloat(fill.px),
        sz: toFloat(fill.sz),
        side: fill.side,
        time: fill.time,
        startPosition: toFloat(fill.startPosition),
        dir: fill.dir,
        closedPnl: toFloat(fill.closedPnl),
        hash: fill.hash,
        oid: fill.oid,
        crossed: fill.crossed,
        fee: toFloat(fill.fee),
        builderFee: fill.builderFee ? toFloat(fill.builderFee) : undefined,
        tid: fill.tid,
        cloid: fill.cloid ?? undefined,
        feeToken: fill.feeToken,
        builder: fill.builder ?? undefined,
        twapId: fill.twapId ?? undefined
    }
}


export function mapRawBlock(raw: raw.Block): Block {
    let header: BlockHeader = {
        number: raw.block_number,
        hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        timestamp: toTimestamp(raw.block_time)
    }
    let fills = raw.events.map(([user, event], fillIndex) => mapRawFill(user, event, fillIndex))
    return { header, fills }
}


function toTimestamp(time: string) {
    let ts = Date.parse(time)
    assert(Number.isSafeInteger(ts))
    return ts
}


function toFloat(val: string) {
    let float = parseFloat(val)
    assert(!Number.isNaN(float))
    return float
}
