import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {Codec} from "@subsquid/scale-codec"
import {
    decodeExtrinsic,
    decodeMetadata,
    getChainDescriptionFromMetadata,
    OldTypes,
    OldTypesBundle
} from "@subsquid/substrate-metadata"
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {assertNotNull, toCamelCase} from "@subsquid/util"
import {CallParser} from "./callParser"
import {SpecInfo, sub} from "./interfaces"
import {Event, Extrinsic} from "./model"
import {blake2bHash, EVENT_STORAGE_KEY, formatId, getBlockTimestamp, isPreV14, omit, unwrapCall} from "./util"
import {Sync, SyncData} from './sync'


export interface SubstrateIngestOptions {
    client: ResilientRpcClient
    sync: Sync,
    typesBundle?: OldTypesBundle
}


export class SubstrateIngest {
    private client: ResilientRpcClient
    private sync: Sync
    private typesBundle?: OldTypesBundle
    private _specInfo?: SpecInfo

    constructor(options: SubstrateIngestOptions) {
        this.client = options.client
        this.sync = options.sync
        this.typesBundle = options.typesBundle
    }

    async *loop(block: number) {
        await this.initSpecInfo(block)

        while (true) {
            yield await this.processBlock(block)
            block += 1
        }
    }

    private async processBlock(blockHeight: number): Promise<void> {
        let metadataToSave: SpecInfo | undefined
        let blockHash = await this.client.call<string>("chain_getBlockHash", [blockHeight])
        let runtimeVersion = await this.client.call<sub.RuntimeVersion>("chain_getRuntimeVersion", [blockHash])
        let specInfo = assertNotNull(this._specInfo)
        if (specInfo.specVersion != runtimeVersion.specVersion) {
            this._specInfo = await this.getSpecInfo(blockHash, runtimeVersion.specVersion)
            metadataToSave = this._specInfo
        }

        let signedBlock = await this.client.call<sub.SignedBlock>("chain_getBlock", [blockHash])
        let rawEvents = await this.client.call("state_getStorageAt", [EVENT_STORAGE_KEY, blockHash])

        let block_id = formatId(blockHeight, blockHash)
        let events: Event[] = specInfo.scaleCodec.decodeBinary(specInfo.description.eventRecordList, rawEvents)
            .map((e: sub.EventRecord, idx: number) => {
                let name = toCamelCase(e.event.__kind) + '.' + e.event.value.__kind
                let args: unknown
                let def = assertNotNull(specInfo.events.definitions[name])
                if (def.fields[0]?.name != null) {
                    args = omit(e.event.value, '__kind')
                } else {
                    args = e.event.value.value
                }
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
                let {name, args} = unwrapCall(ex.call, specInfo)
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

        let calls = new CallParser(specInfo, blockHeight, blockHash, events, extrinsics).calls

        let syncData: SyncData = {
            block: {
                id: block_id,
                height: blockHeight,
                hash: blockHash,
                parent_hash: signedBlock.block.header.parentHash,
                timestamp: getBlockTimestamp(extrinsics)
            },
            extrinsics,
            events,
            calls,
        }

        if (metadataToSave) {
            syncData.metadata = {
                spec_version: metadataToSave.specVersion,
                block_hash: blockHash,
                block_height: blockHeight,
                hex: metadataToSave.rawMetadata,
            }
        }

        try {
            await this.sync.write(syncData)
        } catch (e) {
            console.log('Error while saving data:')
            console.log(syncData)
            throw e
        }
    }

    private async initSpecInfo(blockHeight: number) {
        let blockHash = await this.client.call<string>("chain_getBlockHash", [blockHeight])
        if (blockHeight == 0) {
            this._specInfo = await this.getSpecInfo(blockHash)
        } else {
            let header = await this.client.call<sub.BlockHeader>("chain_getHeader", [blockHash])
            this._specInfo = await this.getSpecInfo(header.parentHash)
        }
    }

    private async getSpecInfo(
        blockHash: string,
        specVersion?: number
    ): Promise<SpecInfo> {
        if (specVersion == null) {
            let rt = await this.client.call<sub.RuntimeVersion>('chain_getRuntimeVersion', [blockHash])
            specVersion = rt.specVersion
        }
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
