import {Bytes, DecodedCall, DecodedEvent, EventRecord, Runtime} from '@subsquid/substrate-runtime'
import {assertNotNull, def} from '@subsquid/util-internal'
import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import assert from 'assert'
import blake2b from 'blake2b'
import {BlockHeader, Call, Event, Extrinsic, ExtrinsicSignature} from '../interfaces/data'
import {RawBlock} from '../interfaces/data-raw'
import {
    Address,
    EventItemList,
    ExtrinsicFailed,
    ExtrinsicFailed_PartError,
    ExtrinsicSuccessLatest,
    ExtrinsicSuccessLegacy,
    IDispatchInfo,
    IEventItem,
    IOrigin,
    ISignature_PartTip,
    Signature_PartTip,
    TimestampSet
} from '../types/system'
import {assertCall, assertEvent, isEvent, UnexpectedEventType} from '../types/util'
import {CallParser} from './call'
import {getFeeCalc} from './fee/calc'
import {addressOrigin, unwrapArguments} from './util'
import {getBlockValidator} from './validator'
import {DigestItem, IDigestItem} from './validator/types'


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
                assertCall(this.runtime, TimestampSet, call)
                return Number(call.args.now)
            }
        }
    }

    @def
    validator(): Bytes | undefined {
        if (this.block.validators == null) return
        return getBlockValidator(this.digest(), this.block.validators)
    }

    @def
    digest(): IDigestItem[] {
        if (!this.runtime.checkType(this.runtime.description.digestItem, DigestItem)) {
            throw new Error('Unexpected type of digest item')
        }
        return this.block.block.block.header.digest.logs.map(bytes => {
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
                assertEvent(this.runtime, TransactionFeePaid, e)
                let actualFee = BigInt(e.args.actualFee)
                let tip = BigInt(e.args.tip)
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

        let parentRuntime = assertNotNull(this.block.runtimeOfPrevBlock)

        let calc = getFeeCalc(
            this.runtime,
            this.block.feeMultiplier,
            parentRuntime.specName,
            parentRuntime.specVersion
        )
        if (calc == null) return

        for (let e of events) {
            let extrinsicIndex: number
            let dispatchInfo: IDispatchInfo
            switch(e.name) {
                case 'System.ExtrinsicSuccess':
                    extrinsicIndex = assertNotNull(e.extrinsicIndex)
                    if (isEvent(this.runtime, ExtrinsicSuccessLatest, e)) {
                        dispatchInfo = e.args.dispatchInfo
                    } else if (isEvent(this.runtime, ExtrinsicSuccessLegacy, e)) {
                        dispatchInfo = e.args
                    } else {
                        throw new UnexpectedEventType('System.ExtrinsicSuccess')
                    }
                    break
                case 'System.ExtrinsicFailed':
                    extrinsicIndex = assertNotNull(e.extrinsicIndex)
                    assertEvent(this.runtime, ExtrinsicFailed, e)
                    if (Array.isArray(e.args)) {
                        dispatchInfo = e.args[1]
                    } else {
                        dispatchInfo = e.args.dispatchInfo
                    }
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

        if (!this.runtime.checkStorageType('System.Events', false, [], EventItemList))
            throw new Error('System.Events storage item has unexpected type')

        let items: IEventItem[] = this.runtime.decodeStorageValue('System.Events', this.block.events)

        return items.map((it, index) => {
            let {name, args} = unwrapArguments(it.event as DecodedEvent, this.runtime.events)
            let e: Event = {
                index,
                name,
                args,
                phase: it.phase.__kind
            }
            if (it.phase.__kind == 'ApplyExtrinsic') {
                e.extrinsicIndex = it.phase.value
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

                let tip = this.getTip(src.signature)
                if (tip != null) {
                    extrinsic.tip = tip
                }
            }

            if (this.options.extrinsicHash) {
                extrinsic.hash = toHex(blake2b(32).update(bytes).digest())
            }

            let origin: IOrigin | undefined
            if (extrinsic.signature && this.runtime.checkType(this.runtime.description.address, Address)) {
                origin = addressOrigin(extrinsic.signature.address)
            }

            let call = this.createCall(extrinsic.index, [], src.call, origin)
            return {extrinsic, call}
        })
    }

    getTip(signature: ExtrinsicSignature): bigint | undefined {
        if (!this.runtime.checkType(this.runtime.description.signature, Signature_PartTip)) return
        let sig = signature as ISignature_PartTip
        if (typeof sig.signedExtensions.ChargeTransactionPayment == 'object') {
            return BigInt(sig.signedExtensions.ChargeTransactionPayment.tip)
        } else {
            return BigInt(sig.signedExtensions.ChargeTransactionPayment)
        }
    }

    createCall(extrinsicIndex: number, address: number[], src: DecodedCall, origin?: IOrigin): Call {
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

    getExtrinsicFailedError(event: EventRecord): any {
        assert(event.name == 'System.ExtrinsicFailed')
        assertEvent(this.runtime, ExtrinsicFailed_PartError, event)
        if (Array.isArray(event.args)) {
            return event.args[1]
        } else {
            return event.args.dispatchError
        }
    }
}
