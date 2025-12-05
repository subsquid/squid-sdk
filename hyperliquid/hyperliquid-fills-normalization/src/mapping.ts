import * as raw from '@subsquid/hyperliquid-fills-data'
import assert from 'assert'
import {BlockHeader, Block} from './data'


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
