import {Bytes} from '@subsquid/substrate-raw-data'
import {assertNotNull, def} from '@subsquid/util-internal'
import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import blake2b from 'blake2b'
import {PartialCall, PartialEvent, PartialExtrinsic} from '../interfaces/data'
import {Runtime} from '../runtime'
import * as parsing from './types'
import {formatId, getExtrinsicTip, unwrapArguments} from './util'
import {getBlockValidator} from './validator'


export class BlockParser {
    public readonly warnings: string[] = []

    constructor(
        private runtime: Runtime,
        private block: parsing.RawBlock,
        private options: {
            withExtrinsicHash?: boolean
        } = {}
    ) {}

    @def
    timestamp(): number | undefined {
        let extrinsics = this.extrinsics()
        if (extrinsics == null) return
        for (let {call} of extrinsics) {
            if (call.name === 'Timestamp.set') {
                return Number(call.args.now)
            }
        }
    }

    @def
    validator(): Bytes | undefined {
        if (this.block.validators == null) return

        let validators = this.runtime.decodeStorageValue(
            'Session.Validators',
            this.block.validators
        )

        let validator = getBlockValidator(this.digest(), validators)
        if (validator) {
            return toHex(validator)
        }
    }

    @def
    digest(): parsing.DigestItem[] {
        return this.block.block.block.header.digest.logs.map<parsing.DigestItem>(bytes => {
            return this.runtime.scaleCodec.decodeBinary(
                this.runtime.description.digestItem,
                bytes
            )
        })
    }

    setExtrinsicFeesFromPaidEvent(): void {
        let extrinsics = this.extrinsics()
        let events = this.events()
        if (extrinsics == null || events == null) return
        for (let e of events) {
            if (e.name == 'TransactionPayment.TransactionFeePaid') {
                let exi = extrinsics[assertNotNull(e.callAddress)[0]]
                let actualFee = BigInt(e.args.actualFee)
                let tip = BigInt(e.args.tip ?? e.args.actualTip)
                exi.extrinsic.fee = actualFee - tip
                exi.extrinsic.tip = tip
            }
        }
    }

    @def
    events(): PartialEvent[] | undefined {
        if (this.block.events == null) return
        let records: parsing.EventRecord[] = this.runtime.decodeStorageValue('System.Events', this.block.events)
        return records.map((rec, idx) => {
            let {name, args} = unwrapArguments(rec.event, this.runtime.events)
            let e: PartialEvent = {
                id: this.formatId(idx),
                indexInBlock: idx,
                name,
                args,
                phase: rec.phase.__kind
            }
            if (rec.phase.__kind == 'ApplyExtrinsic') {
                e.callAddress = [rec.phase.value]
            }
            return e
        })
    }

    @def
    extrinsics(): {extrinsic: PartialExtrinsic, call: PartialCall}[] | undefined {
        return this.block.block.block.extrinsics?.map((hex, idx) => {
            let bytes = decodeHex(hex)
            let src = this.runtime.decodeExtrinsic(bytes)
            let {name, args} = unwrapArguments(src.call, this.runtime.calls)
            let id = this.formatId(idx)

            let extrinsic: PartialExtrinsic = {
                id,
                indexInBlock: idx,
                version: src.version
            }

            if (src.signature) {
                extrinsic.signature = src.signature
            }

            let tip = getExtrinsicTip(src)
            if (tip != null) {
                extrinsic.tip = tip
            }

            if (this.options.withExtrinsicHash) {
                extrinsic.hash = toHex(blake2b(32).digest(bytes))
            }

            let call: PartialCall = {
                id,
                address: [extrinsic.indexInBlock],
                name,
                args
            }

            return {extrinsic, call}
        })
    }

    parseCalls(): void {

    }

    private formatId(...address: number[]): string {
        return formatId(this.block, ...address)
    }
}
