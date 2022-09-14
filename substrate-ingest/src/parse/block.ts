import {decodeExtrinsic, Extrinsic as SubstrateExtrinsic} from '@subsquid/substrate-metadata'
import {assertNotNull, def} from '@subsquid/util-internal'
import {toHex} from '@subsquid/util-internal-hex'
import {Spec, sub} from '../interfaces'
import {Block, BlockData, Call, Event, Extrinsic, Warning} from '../model'
import {blake2bHash} from '../util'
import {CallParser} from './call'
import {FeeCalc} from './feeCalc'
import {
    formatId,
    getDispatchInfoFromExtrinsicFailed,
    getDispatchInfoFromExtrinsicSuccess,
    unwrapArguments
} from './util'
import {Account, getBlockValidator} from './validator'


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
            state_root: this.raw.block.header.stateRoot,
            extrinsics_root: this.raw.block.header.extrinsicsRoot,
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
        let extrinsics = this._extrinsics()
        for (let i = 0; i < extrinsics.length; i++) {
            let ex = extrinsics[i]
            if (ex.call.__kind == 'Timestamp' && ex.call.value.__kind == 'set') {
                return Number(ex.call.value.now)
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
        this.parseCalls()
        this.setExtrinsicFees()
        return this._extrinsics().filter(e => e.pos >= 0)
    }

    @def
    private _extrinsics(): ExtrinsicExt[] {
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
                tip: this.getExtrinsicTip(ex),
                hash,
                pos: -1
            }
        })
    }

    private getExtrinsicTip(ex: SubstrateExtrinsic): bigint | undefined {
        let payment = ex.signature?.signedExtensions.ChargeTransactionPayment
        switch(typeof payment) {
            case 'bigint':
            case 'number':
                return BigInt(payment)
            case 'object':
                switch(typeof payment?.tip) {
                    case 'bigint':
                    case 'number': // Nikau network
                        return BigInt(payment.tip)
                }
        }
    }

    private setExtrinsicFees(): void {
        if (this.spec.events.definitions['TransactionPayment.TransactionFeePaid']) {
            this.setExtrinsicFeesFromPaidEvent()
        } else {
            this.calcExtrinsicFees()
        }
    }

    private setExtrinsicFeesFromPaidEvent(): void {
        let extrinsics = this._extrinsics()
        for (let e of this.events()) {
            if (e.name == 'TransactionPayment.TransactionFeePaid') {
                let ex = extrinsics[assertNotNull(e.extrinsicIdx)]
                let actualFee = BigInt(e.args.actualFee)
                let tip = BigInt(e.args.tip ?? e.args.actualTip)
                ex.fee = actualFee - tip
                ex.tip = tip
            }
        }
    }

    private calcExtrinsicFees(): void {
        if (this.raw.feeMultiplier == null) return
        let calc = FeeCalc.get(this.spec, this.raw.feeMultiplier)
        if (calc == null) return
        for (let e of this.events()) {
            switch(e.name) {
                case 'System.ExtrinsicSuccess':
                    this.calcFee(
                        calc,
                        assertNotNull(e.extrinsicIdx),
                        getDispatchInfoFromExtrinsicSuccess(e.args)
                    )
                    break
                case 'System.ExtrinsicFailed':
                    this.calcFee(
                        calc,
                        assertNotNull(e.extrinsicIdx),
                        getDispatchInfoFromExtrinsicFailed(e.args)
                    )
                    break
            }
        }
    }

    private calcFee(calc: FeeCalc, extrinsicIdx: number, dispatchInfo: sub.DispatchInfo): void {
        let extrinsic = this._extrinsics()[extrinsicIdx]
        if (extrinsic.signature == null) return
        let len = this.raw.block.extrinsics[extrinsicIdx].length / 2 - 1
        extrinsic.fee = calc.calcFee(dispatchInfo, len)
    }

    @def
    private parseCalls(): CallParser {
        let p = new CallParser(
            {
                spec: this.spec,
                blockHeight: this.raw.blockHeight,
                blockHash: this.raw.blockHash
            },
            this.events(),
            this._extrinsics()
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
    return  {
        header: bp.header(),
        extrinsics: bp.extrinsics(),
        events: bp.events(),
        calls: bp.calls(),
        warnings: bp.warnings()
    }
}
