import {Runtime} from '@subsquid/substrate-runtime'
import {assertNotNull, def} from '@subsquid/util-internal'
import assert from 'assert'
import {setEmittedContractAddress} from '../extension/contracts'
import {setEthereumTransact, setEvmLog} from '../extension/evm'
import {setGearProgramId} from '../extension/gear'
import {Block, BlockHeader, Call, DataRequest, Event, Extrinsic} from '../interfaces/data'
import {RawBlock} from '../interfaces/data-raw'
import {parseCalls} from './call'
import {decodeEvents} from './event'
import {DecodedExtrinsic, decodeExtrinsics} from './extrinsic'
import {setExtrinsicFeesFromCalc, setExtrinsicFeesFromPaidEvent} from './fee'
import {supportsFeeCalc} from './fee/calc'
import {getBlockTimestamp} from './timestamp'
import {setExtrinsicTips} from './tip'
import {AccountId, getBlockValidator} from './validator'
import {DigestItem, IDigestItem} from './validator/types'


export function parseBlock(src: RawBlock, options: DataRequest): Block {
    let bp = new BlockParser(src, !!options.extrinsics?.hash)
    let block = bp.block()

    if (options.blockTimestamp) {
        block.header.timestamp = bp.timestamp()
    }

    if (options.blockValidator) {
        block.header.validator = bp.validator()
    }

    if (options.events) {
        block.events = bp.events()
    }

    if (options.extrinsics) {
        block.extrinsics = bp.extrinsics()
        block.calls = bp.calls()
        bp.setExtrinsicTips()
        if (options.extrinsics.fee) {
            bp.setExtrinsicFees()
        }
    }

    if (block.events) {
        for (let e of block.events) {
            setEvmLog(block.runtime, e)
            setEmittedContractAddress(block.runtime, e)
            setGearProgramId(block.runtime, e)
        }
    }

    if (block.calls) {
        for (let c of block.calls) {
            setEthereumTransact(block.runtime, c)
        }
    }

    return block
}


class BlockParser {
    public readonly runtime: Runtime

    constructor(private src: RawBlock, private withExtrinsicHash: boolean) {
        this.runtime = assertNotNull(src.runtime)
    }

    @def
    block(): Block {
        return new Block(
            this.runtime,
            assertNotNull(this.src.runtimeOfPrevBlock),
            this.header()
        )
    }

    @def
    header(): BlockHeader {
        let runtimeVersion = assertNotNull(this.src.runtimeVersion)
        let hdr = this.src.block.block.header
        return {
            height: this.src.height,
            hash: this.src.hash,
            parentHash: hdr.parentHash,
            digest: hdr.digest,
            extrinsicsRoot: hdr.extrinsicsRoot,
            stateRoot: hdr.stateRoot,
            specName: runtimeVersion.specName,
            specVersion: runtimeVersion.specVersion,
            implName: runtimeVersion.implName,
            implVersion: runtimeVersion.implVersion
        }
    }

    @def
    decodedExtrinsics(): DecodedExtrinsic[] {
        let extrinsics = assertNotNull(this.src.block.block.extrinsics, 'extrinsic data is not provided')
        return decodeExtrinsics(this.runtime, extrinsics, this.withExtrinsicHash)
    }

    @def
    extrinsics(): Extrinsic[] {
        return this.decodedExtrinsics().map(ex => ex.extrinsic)
    }

    @def
    events(): Event[] {
        assert('events' in this.src, 'event data is not provided')
        if (this.src.events == null) return []
        return decodeEvents(this.runtime, this.src.events)
    }

    @def
    calls(): Call[] {
        return parseCalls(
            this.src,
            this.decodedExtrinsics(),
            this.events()
        )
    }

    @def
    digest(): unknown[] {
        return this.src.block.block.header.digest.logs.map(hex => {
            return this.runtime.scaleCodec.decodeBinary(
                this.runtime.description.digestItem,
                hex
            )
        })
    }

    @def
    validator(): AccountId | undefined {
        if (
            this.runtime.hasStorageItem('Session.Validators') &&
            this.runtime.checkType(this.runtime.description.digestItem, DigestItem)
        ) {
            let digest = this.digest() as IDigestItem[]
            let validators = assertNotNull(this.src.validators, 'validator data is not provided')
            return getBlockValidator(digest, validators)
        }
    }

    @def
    timestamp(): number {
        return getBlockTimestamp(this.runtime, this.decodedExtrinsics())
    }

    @def
    setExtrinsicFees(): void {
        if (this.runtime.hasEvent('TransactionPayment.TransactionFeePaid')) {
            setExtrinsicFeesFromPaidEvent(this.runtime, this.extrinsics(), this.events())
        } else if (supportsFeeCalc(this.runtime)) {
            assert(this.src.feeMultiplier != null, 'fee multiplier value is not provided')
            let extrinsics = this.extrinsics()
            let rawExtrinsics = assertNotNull(this.src.block.block.extrinsics)
            setExtrinsicFeesFromCalc(
                this.runtime,
                rawExtrinsics,
                extrinsics,
                this.events(),
                this.block().runtimeOfPrevBlock.specName,
                this.block().runtimeOfPrevBlock.specVersion,
                this.src.feeMultiplier
            )
        }
    }

    @def
    setExtrinsicTips(): void {
        setExtrinsicTips(this.runtime, this.extrinsics())
    }
}
