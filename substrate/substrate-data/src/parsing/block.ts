import {Bytes} from '@subsquid/substrate-raw-data'
import {assertNotNull, def} from '@subsquid/util-internal'
import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import blake2b from 'blake2b'
import {BlockHeader, Call, Event, Extrinsic} from '../interfaces/data'
import * as decoded from '../interfaces/data-decoded'
import {RawBlock} from '../interfaces/data-raw'
import {Runtime} from '../runtime'
import {CallParser} from './call'
import {addressOrigin, getExtrinsicTip, noneOrigin, unwrapArguments} from './util'
import {getBlockValidator} from './validator'


export interface ParsingOptions {
    extrinsicHash?: boolean
}


export class BlockParser {
    constructor(
        public readonly runtime: Runtime,
        public readonly block: RawBlock,
        private options: ParsingOptions = {}
    ) {}

    @def
    header(): BlockHeader {
        let src = this.block.block.block.header
        let runtimeVersion = assertNotNull(this.block.runtimeVersion)
        let header: BlockHeader = {
            height: this.block.height,
            hash: this.block.hash,
            parentHash: src.parentHash,
            digest: src.digest,
            extrinsicsRoot: src.extrinsicsRoot,
            stateRoot: src.stateRoot,
            specId: `${runtimeVersion.specName}@${runtimeVersion.specVersion}`,
            implId: `${runtimeVersion.implName}@${runtimeVersion.implVersion}`
        }
        if (this.timestamp()) {
            header.timestamp = this.timestamp()
        }
        if (this.validator()) {
            header.validator = this.validator()
        }
        return header
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
                extrinsic.hash = toHex(blake2b(32).digest(bytes))
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
