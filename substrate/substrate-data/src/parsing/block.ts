import {Runtime} from '@subsquid/substrate-runtime'
import {assertNotNull, def} from '@subsquid/util-internal'
import {Block, BlockHeader, Call, Event, Extrinsic} from '../interfaces/data'
import {RawBlock} from '../interfaces/data-raw'
import {parseCalls} from './call'
import {decodeEvents} from './event'
import {DecodedExtrinsic, decodeExtrinsics} from './extrinsic'
import {AccountId, getBlockValidator} from './validator'
import {DigestItem, IDigestItem} from './validator/types'


export interface ParsingOptions {
    extrinsicHash?: boolean
}


export function parseBlock(src: RawBlock, options: ParsingOptions): Block {
    let bp = new BlockParser(src, options)
    return bp.block()
}


class BlockParser {
    public readonly runtime: Runtime

    constructor(private src: RawBlock, private options: ParsingOptions) {
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
        return decodeExtrinsics(this.runtime, extrinsics, !!this.options.extrinsicHash)
    }

    @def
    extrinsics(): Extrinsic[] {
        return this.decodedExtrinsics().map(ex => ex.extrinsic)
    }

    @def
    events(): Event[] {
        let events = assertNotNull(this.src.events, 'event data is not provided')
        return decodeEvents(this.runtime, events)
    }

    @def
    calls(): Call[] {
        return parseCalls(
            this.runtime,
            this.decodedExtrinsics(),
            this.events()
        )
    }

    @def
    digest(): unknown[] {
        return this.src.block.block.header.digest.logs.map(hex => {
            return this.runtime.scaleCodec.decodeBinary(
                this.runtime.description.digest,
                hex
            )
        })
    }

    @def
    validator(): AccountId | undefined {
        if (this.runtime.checkType(this.runtime.description.digestItem, DigestItem)) {
            let digest = this.digest() as IDigestItem[]
            let validators = assertNotNull(this.src.validators, 'validator data is not provided')
            return getBlockValidator(digest, validators)
        }
    }
}
