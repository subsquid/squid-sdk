import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {Codec} from "@subsquid/scale-codec"
import {
    decodeExtrinsic,
    decodeMetadata,
    getChainDescriptionFromMetadata,
    getOldTypesBundle,
    OldTypes,
    OldTypesBundle
} from "@subsquid/substrate-metadata"
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {assertNotNull} from "@subsquid/util"
import assert from "assert"
import {CallParser} from "./call-parser"
import {SpecInfo, sub} from "./interfaces"
import {BlockData, Event, Extrinsic} from "./model"
import {blake2bHash, EVENT_STORAGE_KEY, formatId, getBlockTimestamp, isPreV14, unwrapArguments} from "./util/misc"


export interface IngestOptions {
    client: ResilientRpcClient
    typesBundle?: OldTypesBundle
    startBlock?: number
}


export class Ingest {
    static getBlocks(options: IngestOptions): AsyncGenerator<BlockData> {
        return new Ingest(options).loop()
    }

    private initialBlock = 0
    private client: ResilientRpcClient
    private typesBundle?: OldTypesBundle
    private _specInfo?: SpecInfo

    private constructor(options: IngestOptions) {
        this.client = options.client
        this.typesBundle = options.typesBundle
        if (options.startBlock) {
            assert(options.startBlock >= 0)
            this.initialBlock = options.startBlock
        }
    }

    private async *loop(): AsyncGenerator<BlockData> {
        await this.init()
        let height = this.initialBlock
        let promise = this.fetchBlock(height).catch(err => err as Error)
        while (true) {
            let block = await promise
            if (block instanceof Error) throw block
            height += 1
            promise = this.fetchBlock(height).catch(err => err as Error)
            yield block
        }
    }

    private async fetchBlock(blockHeight: number): Promise<BlockData> {
        let metadataToSave: SpecInfo | undefined
        let blockHash = await this.client.call<string>("chain_getBlockHash", [blockHeight])
        let runtimeVersion = await this.client.call<sub.RuntimeVersion>("chain_getRuntimeVersion", [blockHash])
        let specInfo = assertNotNull(this._specInfo)
        if (specInfo.specVersion != runtimeVersion.specVersion) {
            this._specInfo = await this.getSpecInfo(blockHash, runtimeVersion.specVersion)
            metadataToSave = this._specInfo
        } else if (blockHeight == 0) {
            metadataToSave = this._specInfo
        }

        let [signedBlock, rawEvents] = await Promise.all([
            this.client.call<sub.SignedBlock>("chain_getBlock", [blockHash]),
            this.client.call<string>("state_getStorageAt", [EVENT_STORAGE_KEY, blockHash])
        ])

        let block_id = formatId(blockHeight, blockHash)
        let events: Event[] = rawEvents == null ? [] : specInfo.scaleCodec.decodeBinary(specInfo.description.eventRecordList, rawEvents)
            .map((e: sub.EventRecord, idx: number) => {
                let {name, args} = unwrapArguments(e.event, specInfo.events)
                let extrinsic_id: string | undefined
                if (e.phase.__kind == 'ApplyExtrinsic') {
                    extrinsic_id = formatId(blockHeight, blockHash, e.phase.value)
                }
                return {
                    id: formatId(blockHeight, blockHash, idx),
                    block_id,
                    phase: e.phase.__kind,
                    index_in_block: idx,
                    name,
                    args,
                    extrinsic_id
                }
            })

        let extrinsics: (Extrinsic & {args: unknown})[] = signedBlock.block.extrinsics
            .map((hex, idx) => {
                let bytes = Buffer.from(hex.slice(2), 'hex')
                let hash = blake2bHash(bytes, 32)
                let ex = decodeExtrinsic(bytes, specInfo.description, specInfo.scaleCodec)
                let {name, args} = unwrapArguments(ex.call, specInfo.calls)
                return {
                    id: formatId(blockHeight, blockHash, idx),
                    block_id,
                    index_in_block: idx,
                    name,
                    signature: ex.signature,
                    success: true,
                    hash,
                    args
                }
            })

        let calls = new CallParser(specInfo, blockHeight, blockHash, events, extrinsics).getCalls()

        let block: BlockData = {
            header: {
                id: block_id,
                height: blockHeight,
                hash: blockHash,
                parent_hash: signedBlock.block.header.parentHash,
                timestamp: new Date(getBlockTimestamp(extrinsics))
            },
            extrinsics,
            events,
            calls,
        }

        if (metadataToSave) {
            block.metadata = {
                spec_version: metadataToSave.specVersion,
                block_hash: blockHash,
                block_height: blockHeight,
                hex: metadataToSave.rawMetadata,
            }
        }

        return block
    }

    private async init(): Promise<void> {
        let height = this.initialBlock == 0 ? 0 : this.initialBlock - 1
        let blockHash = await this.client.call<string>("chain_getBlockHash", [height])
        let rt = await this.client.call<sub.RuntimeVersion>('chain_getRuntimeVersion', [blockHash])
        if (this.typesBundle == null) {
            this.typesBundle = getOldTypesBundle(rt.specName)
        }
        this._specInfo = await this.getSpecInfo(blockHash, rt.specVersion)
    }

    private async getSpecInfo(
        blockHash: string,
        specVersion: number
    ): Promise<SpecInfo> {
        let rawMetadata: string = await this.client.call("state_getMetadata", [blockHash])
        let metadata = decodeMetadata(rawMetadata)
        let oldTypes: OldTypes | undefined
        if (isPreV14(metadata)) {
            oldTypes = getTypesFromBundle(assertNotNull(this.typesBundle), specVersion)
        }
        let description = getChainDescriptionFromMetadata(metadata, oldTypes)
        return {
            description,
            rawMetadata,
            specVersion,
            scaleCodec: new Codec(description.types),
            events: new eac.Registry(description.types, description.event),
            calls: new eac.Registry(description.types, description.call)
        }
    }
}
