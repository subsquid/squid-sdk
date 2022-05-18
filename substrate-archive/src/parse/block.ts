import {decodeExtrinsic} from "@subsquid/substrate-metadata"
import {Spec, sub} from "../interfaces"
import {BlockData, Event, Extrinsic, Warning} from "../model"
import {blake2bHash, formatId, getBlockTimestamp, unwrapArguments} from "../util"
import {CallParser} from "./call"


export interface RawBlock {
    blockHash: string
    blockHeight: number
    block: sub.Block
    events?: string | null
}


export function parseRawBlock(spec: Spec, raw: RawBlock): BlockData {
    let block_id = formatId(raw.blockHeight, raw.blockHash)

    let events: Event[] = raw.events == null ? [] : spec.scaleCodec.decodeBinary(spec.description.eventRecordList, raw.events)
        .map((e: sub.EventRecord, idx: number) => {
            let {name, args} = unwrapArguments(e.event, spec.events)
            let extrinsic_id: string | undefined
            if (e.phase.__kind == 'ApplyExtrinsic') {
                extrinsic_id = formatId(raw.blockHeight, raw.blockHash, e.phase.value)
            }
            return {
                id: formatId(raw.blockHeight, raw.blockHash, idx),
                block_id,
                phase: e.phase.__kind,
                index_in_block: idx,
                name,
                args,
                extrinsic_id,
                pos: -1
            }
        })

    let extrinsics: (Extrinsic & {name: string, args: unknown})[] = raw.block.extrinsics
        .map((hex, idx) => {
            let bytes = Buffer.from(hex.slice(2), 'hex')
            let hash = blake2bHash(bytes, 32)
            let ex = decodeExtrinsic(bytes, spec.description, spec.scaleCodec)
            let {name, args} = unwrapArguments(ex.call, spec.calls)
            return {
                id: formatId(raw.blockHeight, raw.blockHash, idx),
                block_id,
                index_in_block: idx,
                success: true,
                signature: ex.signature,
                call_id: '',
                hash,
                name,
                args,
                pos: -1
            }
        })

    let warnings: Warning[] = []

    let calls = new CallParser(
        spec,
        raw.blockHeight,
        raw.blockHash,
        events,
        extrinsics,
        warnings
    ).getCalls()

    return  {
        header: {
            id: block_id,
            height: raw.blockHeight,
            hash: raw.blockHash,
            parent_hash: raw.block.header.parentHash,
            timestamp: new Date(getBlockTimestamp(extrinsics)),
            spec_id: '' // to be set later
        },
        extrinsics,
        events,
        calls,
        warnings
    }
}
