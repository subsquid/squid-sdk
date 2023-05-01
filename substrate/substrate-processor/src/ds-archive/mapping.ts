import {addErrorContext, assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {BlockDataP, BlockItemP} from '../interfaces/data'
import {SubstrateCallP, SubstrateEventP, SubstrateExtrinsicP} from '../interfaces/data-selection'
import * as gw from './gateway'


export function mapGatewayBlock(block: gw.Block): BlockDataP {
    try {
        return tryMapGatewayBlock(block)
    } catch(e: any) {
        throw addErrorContext(e, {
            blockHeight: block.header.height,
            blockHash: block.header.hash
        })
    }
}


function tryMapGatewayBlock(block: gw.Block): BlockDataP {
    let events = createObjects<gw.Event, SubstrateEventP>(block.events, go => {
        let {callId, extrinsicId, ...event} = go
        return event
    })

    let calls = createObjects<gw.Call, SubstrateCallP>(block.calls, go => {
        let {parentId, extrinsicId, ...call} = go
        return call
    })

    let extrinsics = createObjects<gw.Extrinsic, SubstrateExtrinsicP>(block.extrinsics || [], go => {
        let {callId, fee, tip, ...rest} = go
        let extrinsic: SubstrateExtrinsicP = rest
        if (fee != null) {
            extrinsic.fee = BigInt(fee)
        }
        if (tip != null) {
            extrinsic.tip = BigInt(tip)
        }
        return extrinsic
    })

    let items: BlockItemP[] = []

    for (let go of block.events || []) {
        let event = assertNotNull(events.get(go.id))
        if (go.extrinsicId) {
            event.extrinsic = assertNotNull(extrinsics.get(go.extrinsicId))
        }
        if (go.callId) {
            event.call = assertNotNull(calls.get(go.callId))
        }
        items.push({
            kind: 'event',
            name: event.name,
            event
        })
    }

    for (let go of block.calls || []) {
        let call = assertNotNull(calls.get(go.id))
        if (go.parentId) {
            call.parent = assertNotNull(calls.get(go.parentId))
        }
        let item: BlockItemP = {
            kind: 'call',
            name: call.name,
            call
        }
        if (go.extrinsicId) {
            item.extrinsic = assertNotNull(extrinsics.get(go.extrinsicId))
        }
        items.push(item)
    }

    for (let go of block.extrinsics || []) {
        if (go.callId) {
            let extrinsic = assertNotNull(extrinsics.get(go.id))
            extrinsic.call = assertNotNull(calls.get(go.id))
        }
    }

    items.sort((a, b) => getPos(a) - getPos(b))

    let {timestamp, validator, ...hdr} = block.header

    return {
        header: {...hdr, timestamp: new Date(timestamp).valueOf(), validator: validator ?? undefined},
        items
    }
}


function createObjects<S, T extends {id: string}>(src: S[] | undefined, f: (s: S) => T): Map<string, T> {
    let m = new Map<string, T>()
    if (src == null) return m
    for (let i = 0; i < src.length; i++) {
        let obj = f(src[i])
        m.set(obj.id, obj)
    }
    return m
}


function getPos(item: BlockItemP): number {
    switch(item.kind) {
        case 'call':
            return item.call.pos
        case 'event':
            return item.event.pos
        default:
            throw unexpectedCase()
    }
}
