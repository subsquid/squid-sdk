import {Bytes} from '@subsquid/substrate-data-raw'
import {assertNotNull, def} from '@subsquid/util-internal'
import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import blake2b from 'blake2b'
import {BlockHeader, Call, Event, Extrinsic} from '../interfaces/data'
import * as decoded from '../interfaces/data-decoded'
import {RawBlock} from '../interfaces/data-raw'
import {Runtime} from '../runtime'
import {CallParser} from './call'
import {getFeeCalc} from './fee'
import {
    addressOrigin,
    getDispatchInfoFromExtrinsicFailed,
    getDispatchInfoFromExtrinsicSuccess,
    getExtrinsicTip,
    noneOrigin,
    unwrapArguments
} from './util'
import {getBlockValidator} from './validator'


export interface ParsingOptions {
    extrinsicHash?: boolean
}


export class BlockParser {
    public readonly runtime: Runtime

    constructor(
        public readonly block: RawBlock,
        private options: ParsingOptions = {}
    ) {
        this.runtime = assertNotNull(block.runtime)
    }

    @def
    header(): BlockHeader {
        let src = this.block.block.block.header
        let runtimeVersion = assertNotNull(this.block.runtimeVersion)
        return {
            height: this.block.height,
            hash: this.block.hash,
            parentHash: src.parentHash,
            digest: src.digest,
            extrinsicsRoot: src.extrinsicsRoot,
            stateRoot: src.stateRoot,
            specName: runtimeVersion.specName,
            specVersion: runtimeVersion.specVersion,
            implName: runtimeVersion.implName,
            implVersion: runtimeVersion.implVersion
        }
    }

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
        let validator = getBlockValidator(this.digest(), this.block.validators)
        if (validator) {
            return toHex(validator)
        }
    }

    @def
    digest(): decoded.DigestItem[] {
        return this.block.block.block.header.digest.logs.map<decoded.DigestItem>(bytes => {
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
                let exi = extrinsics[assertNotNull(e.extrinsicIndex)]
                let actualFee = BigInt(e.args.actualFee)
                let tip = BigInt(e.args.tip ?? e.args.actualTip)
                exi.extrinsic.fee = actualFee - tip
                exi.extrinsic.tip = tip
            }
        }
    }

    calcExtrinsicFees(): void {
        if (this.block.feeMultiplier == null) return
        let extrinsics = this.extrinsics()
        let events = this.events()
        if (extrinsics == null || events == null) return
        let parentRuntime = assertNotNull(this.block.runtimeOfPreviousBlock)
        let calc = getFeeCalc(
            this.runtime,
            this.block.feeMultiplier,
            parentRuntime.specName,
            parentRuntime.specVersion
        )
        if (calc == null) return
        for (let e of events) {
            let extrinsicIndex: number
            let dispatchInfo: decoded.DispatchInfo
            switch(e.name) {
                case 'System.ExtrinsicSuccess':
                    extrinsicIndex = assertNotNull(e.extrinsicIndex)
                    dispatchInfo = getDispatchInfoFromExtrinsicSuccess(e.args)
                    break
                case 'System.ExtrinsicFailed':
                    extrinsicIndex = assertNotNull(e.extrinsicIndex)
                    dispatchInfo = getDispatchInfoFromExtrinsicFailed(e.args)
                    break
                default:
                    continue
            }
            let extrinsic = extrinsics[extrinsicIndex].extrinsic
            if (extrinsic.signature == null) continue
            let len = this.block.block.block.extrinsics![extrinsicIndex].length / 2 - 1
            extrinsic.fee = calc(dispatchInfo, len)
        }
    }

    @def
    events(): Event[] | undefined {
        if (this.block.events == null) return
        let records: decoded.EventRecord[] = this.runtime.decodeStorageValue('System.Events', this.block.events)
        return records.map((rec, index) => {
            let {name, args} = unwrapArguments(rec.event, this.runtime.events)
            let e: Event = {
                index,
                name,
                args,
                phase: rec.phase.__kind
            }
            if (rec.phase.__kind == 'ApplyExtrinsic') {
                e.extrinsicIndex = rec.phase.value
            }
            return e
        })
    }

    @def
    extrinsics(): {extrinsic: Extrinsic, call: Call}[] | undefined {
        return this.block.block.block.extrinsics?.map((hex, idx) => {
            let bytes = decodeHex(hex)
            let src = this.runtime.decodeExtrinsic(bytes)

            let extrinsic: Extrinsic = {
                index: idx,
                version: src.version
            }

            if (src.signature) {
                extrinsic.signature = src.signature
            }

            let tip = getExtrinsicTip(src)
            if (tip != null) {
                extrinsic.tip = tip
            }

            if (this.options.extrinsicHash) {
                extrinsic.hash = toHex(blake2b(32).update(bytes).digest())
            }

            let address = extrinsic.signature?.address
            let origin = address ? addressOrigin(address) : noneOrigin()
            let call = this.createCall(extrinsic.index, [], src.call, origin)

            return {extrinsic, call}
        })
    }

    createCall(extrinsicIndex: number, address: number[], src: decoded.Call, origin?: any): Call {
        let {name, args} = unwrapArguments(src, this.runtime.calls)
        return {
            extrinsicIndex,
            address,
            name,
            args,
            origin
        }
    }

    @def
    calls(): Call[] | undefined {
        let events = this.events()
        let extrinsics = this.extrinsics()
        if (events == null || extrinsics == null) return
        let parser = new CallParser(this, extrinsics, events)
        parser.parse()
        return parser.calls.reverse()
    }
}
