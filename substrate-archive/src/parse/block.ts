import {decodeExtrinsic} from "@subsquid/substrate-metadata"
import {Spec, sub} from "../interfaces"
import {BlockData, Event, Extrinsic, Warning} from "../model"
import {blake2bHash, formatId, getBlockTimestamp, unwrapArguments} from "../util"
import {CallParser} from "./call"
import {FeeCalc} from "./feeCalc"


export interface RawBlock {
    blockHash: string
    blockHeight: number
    block: sub.Block
    events?: string | null
    feeMultiplier?: string | null
}


export interface EventExt extends Event {
    extrinsicIdx?: number
}


export interface ExtrinsicExt extends Extrinsic {
    name: string
    args: any
}


export function parseRawBlock(spec: Spec, raw: RawBlock): BlockData {
    let block_id = formatId(raw.blockHeight, raw.blockHash)

    let events: EventExt[] = raw.events == null
        ? []
        : spec.scaleCodec.decodeBinary(spec.description.eventRecordList, raw.events)
            .map((e: sub.EventRecord, idx: number) => {
                let {name, args} = unwrapArguments(e.event, spec.events)
                let extrinsic_id: string | undefined
                let extrinsicIdx: number | undefined
                if (e.phase.__kind == "ApplyExtrinsic") {
                    extrinsicIdx = e.phase.value
                    extrinsic_id = formatId(raw.blockHeight, raw.blockHash, extrinsicIdx)
                }
                return {
                    id: formatId(raw.blockHeight, raw.blockHash, idx),
                    block_id,
                    phase: e.phase.__kind,
                    index_in_block: idx,
                    name,
                    args,
                    extrinsic_id,
                    extrinsicIdx,
                    pos: -1
                }
            })

    let extrinsics: ExtrinsicExt[] = raw.block.extrinsics
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
                tip: ex.signature?.signedExtensions.ChargeTransactionPayment,
                call_id: '',
                hash,
                name,
                args,
                pos: -1
            }
        })

    setExtrinsicFees(spec, raw, extrinsics, events)

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


function setExtrinsicFees(spec: Spec, raw: RawBlock, extrinsics: ExtrinsicExt[], events: EventExt[]): void {
    if (raw.feeMultiplier == null) return
    let calc = FeeCalc.get(spec, raw.feeMultiplier)
    if (calc == null) return
    for (let e of events) {
        switch(e.name) {
            case 'System.ExtrinsicSuccess':
            case 'System.ExtrinsicFailed':
                let extrinsicIdx = e.extrinsicIdx!
                let extrinsic = extrinsics[extrinsicIdx]
                if (extrinsic.signature != null) {
                    let dispatchInfo = e.args.dispatchInfo as sub.DispatchInfo
                    let len = raw.block.extrinsics[extrinsicIdx].length / 2 - 1
                    extrinsic.fee = calc.calcFee(dispatchInfo, len)
                }
                break
        }
    }
}
