import {decodeExtrinsic} from "@subsquid/substrate-metadata"
import {assertNotNull, def} from "@subsquid/util-internal"
import {toHex} from "@subsquid/util-internal-hex"
import {Spec, sub} from "../interfaces"
import {Block, BlockData, Call, Event, Extrinsic, Warning} from "../model"
import {blake2bHash} from "../util"
import {CallParser} from "./call"
import {FeeCalc} from "./feeCalc"
import {
    formatId,
    getDispatchInfoFromExtrinsicFailed,
    getDispatchInfoFromExtrinsicSuccess,
    unwrapArguments
} from "./util"
import {Account, getBlockValidator} from "./validator"


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
    call: sub.Call
}


export class BlockParser {
    constructor(
        private spec: Spec,
        private validators: Account[],
        private raw: RawBlock
    ) {
    }

    @def
    id(): string {
        return formatId(this.raw.blockHeight, this.raw.blockHash)
    }

    @def
    header(): Block {
        return {
            id: this.id(),
            height: this.raw.blockHeight,
            hash: this.raw.blockHash,
            parent_hash: this.raw.block.header.parentHash,
            timestamp: new Date(this.timestamp()),
            validator: this.validator(),
            spec_id: '' // to be set later
        }
    }

    @def
    validator(): string | undefined {
        let validator = getBlockValidator(this.digest(), this.validators)
        if (validator) {
            return toHex(validator)
        }
    }

    @def
    digest(): sub.DigestItem[] {
        return this.raw.block.header.digest.logs.map<sub.DigestItem>(item => {
            return this.spec.scaleCodec.decodeBinary(this.spec.description.digestItem, item)
        })
    }

    @def
    timestamp(): number {
        let extrinsics = this.extrinsics()
        for (let i = 0; i < extrinsics.length; i++) {
            let ex = extrinsics[i]
            if (ex.call.__kind == 'Timestamp' && ex.call.value.__kind == 'set') {
                return ex.call.value.now
            }
        }
        return 0
    }

    @def
    events(): EventExt[] {
        if (this.raw.events == null) return []
        let block_id = this.id()
        let records: sub.EventRecord[] = this.spec.scaleCodec.decodeBinary(
            this.spec.description.eventRecordList,
            this.raw.events
        )
        return records.map((rec, idx) => {
            let {name, args} = unwrapArguments(rec.event, this.spec.events)
            let extrinsicIdx: number | undefined
            let extrinsic_id: string | undefined
            if (rec.phase.__kind == "ApplyExtrinsic") {
                extrinsicIdx = rec.phase.value
                extrinsic_id = formatId(this.raw.blockHeight, this.raw.blockHash, extrinsicIdx)
            }
            return {
                id: formatId(this.raw.blockHeight, this.raw.blockHash, idx),
                block_id,
                phase: rec.phase.__kind,
                index_in_block: idx,
                name,
                args,
                extrinsic_id,
                extrinsicIdx,
                pos: -1
            }
        })
    }

    @def
    extrinsics(): ExtrinsicExt[] {
        let block_id = this.id()
        return this.raw.block.extrinsics.map((hex, idx) => {
            let id = formatId(this.raw.blockHeight, this.raw.blockHash, idx)
            let bytes = Buffer.from(hex.slice(2), 'hex')
            let hash = blake2bHash(bytes, 32)
            let ex = decodeExtrinsic(bytes, this.spec.description, this.spec.scaleCodec)
            return {
                id,
                block_id,
                index_in_block: idx,
                success: true,
                version: ex.version,
                signature: ex.signature,
                call_id: id,
                call: ex.call,
                tip: ex.signature?.signedExtensions.ChargeTransactionPayment,
                hash,
                pos: -1
            }
        })
    }

    @def
    setExtrinsicFees(): void {
        if (this.raw.feeMultiplier == null) return
        let calc = FeeCalc.get(this.spec, this.raw.feeMultiplier)
        if (calc == null) return
        for (let e of this.events()) {
            switch(e.name) {
                case 'System.ExtrinsicSuccess':
                    this.setFee(
                        calc,
                        assertNotNull(e.extrinsicIdx),
                        getDispatchInfoFromExtrinsicSuccess(e.args)
                    )
                    break
                case 'System.ExtrinsicFailed':
                    this.setFee(
                        calc,
                        assertNotNull(e.extrinsicIdx),
                        getDispatchInfoFromExtrinsicFailed(e.args)
                    )
                    break
            }
        }
    }

    private setFee(calc: FeeCalc, extrinsicIdx: number, dispatchInfo: sub.DispatchInfo): void {
        let extrinsic = this.extrinsics()[extrinsicIdx]
        if (extrinsic.signature == null) return
        let len = this.raw.block.extrinsics[extrinsicIdx].length / 2 - 1
        extrinsic.fee = calc.calcFee(dispatchInfo, len)
    }

    @def
    parseCalls(): CallParser {
        let p = new CallParser(
            {
                spec: this.spec,
                blockHeight: this.raw.blockHeight,
                blockHash: this.raw.blockHash
            },
            this.events(),
            this.extrinsics()
        )
        p.calls.sort((a, b) => a.pos - b.pos)
        return p
    }

    calls(): Call[] {
        return this.parseCalls().calls
    }

    warnings(): Warning[] {
        return this.parseCalls().warnings
    }
}


export function parseRawBlock(spec: Spec, validators: Account[], raw: RawBlock): BlockData {
    let bp = new BlockParser(spec, validators, raw)
    bp.setExtrinsicFees()
    return  {
        header: bp.header(),
        extrinsics: bp.extrinsics(),
        events: bp.events(),
        calls: bp.calls(),
        warnings: bp.warnings()
    }
}
