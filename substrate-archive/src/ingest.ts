import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {Codec} from "@subsquid/scale-codec"
import {
    decodeExtrinsic,
    decodeMetadata,
    getChainDescriptionFromMetadata,
    getOldTypesBundle,
    OldTypes,
    OldTypesBundle,
    SpecVersion
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
    clients: ResilientRpcClient[]
    typesBundle?: OldTypesBundle
    startBlock?: number
}


export class Ingest {
    static getBlocks(options: IngestOptions): AsyncGenerator<BlockData> {
        return new Ingest(options).loop()
    }

    private initialBlock: number
    private stridesHead: number
    private clients: ResilientRpcClient[]
    private idle: ResilientRpcClient[]
    private typesBundle?: OldTypesBundle
    private _specInfo?: SpecInfo
    private strides: Promise<RawBlockData[] | Error>[] = []
    private maxStrides
    private specs: BlockSpec[] = []

    private constructor(options: IngestOptions) {
        assert(options.clients.length > 0, 'no chain client to work with')
        this.clients = options.clients
        this.idle = this.clients.slice()
        this.maxStrides = Math.max(this.clients.length * 10)
        this.typesBundle = options.typesBundle
        if (options.startBlock) {
            assert(options.startBlock >= 0)
            this.initialBlock = options.startBlock
        } else {
            this.initialBlock = 0
        }
        this.stridesHead = this.initialBlock
    }

    private async *loop(): AsyncGenerator<BlockData> {
        await this.init()
        while (true) {
            this.useIdleClients()
            let blocks = await assertNotNull(this.strides.shift())
            if (blocks instanceof Error) throw blocks
            for (let raw of blocks) {
                let specInfo = this.specInfo
                let block = this.parse(specInfo, raw)
                if (await this.updateSpecInfo(raw.blockHeight) || raw.blockHeight == 0) {
                    block.metadata = {
                        spec_version: this.specInfo.specVersion,
                        block_hash: raw.blockHash,
                        block_height: raw.blockHeight,
                        hex: this.specInfo.rawMetadata,
                    }
                }
                yield block
            }
        }
    }

    private useIdleClients(): void {
        let client: ResilientRpcClient | undefined
        let vacant = this.maxStrides - this.strides.length
        while (vacant > 0 && (client = this.idle.shift())) {
            this.fetchLoop(client).catch()
            vacant -= 1
        }
    }

    private async fetchLoop(client: ResilientRpcClient): Promise<void> {
        while (this.strides.length <= this.maxStrides) {
            let size = 10
            let height = this.stridesHead
            this.stridesHead += size
            let promise = this.fetchStride(client, height, size).catch(err => err)
            this.strides.push(promise)
            await promise
        }
        this.idle.push(client)
    }

    private async fetchStride(client: ResilientRpcClient, height: number, size: number): Promise<RawBlockData[]> {
        assert(size > 0)
        let last = height + size - 1
        let blockHash =  await client.call<string>("chain_getBlockHash", [last])
        let result: RawBlockData[] = new Array(size)
        for (let i = size - 1; i >= 0; i--) {
            let [signedBlock, events] = await Promise.all([
                client.call<sub.SignedBlock>("chain_getBlock", [blockHash]),
                client.call<string>("state_getStorageAt", [EVENT_STORAGE_KEY, blockHash])
            ])
            result[i] = {
                blockHash,
                blockHeight: height + i,
                block: signedBlock.block,
                events
            }
            blockHash = signedBlock.block.header.parentHash
        }
        return result
    }

    private parse(specInfo: SpecInfo, raw: RawBlockData): BlockData {
        let block_id = formatId(raw.blockHeight, raw.blockHash)
        let events: Event[] = raw.events == null ? [] : specInfo.scaleCodec.decodeBinary(specInfo.description.eventRecordList, raw.events)
            .map((e: sub.EventRecord, idx: number) => {
                let {name, args} = unwrapArguments(e.event, specInfo.events)
                let extrinsic_id: string | undefined
                if (e.phase.__kind == 'ApplyExtrinsic') {
                    extrinsic_id = formatId(raw.blockHeight, raw.blockHash, e.phase.value)
                }
                return {
                    id: formatId(raw.blockHeight, raw.blockHash, idx),
                    block_id,
                    phase: e.phase.__kind,
                    index_in_block: idx,
                    name,
                    args,
                    extrinsic_id
                }
            })

        let extrinsics: (Extrinsic & {args: unknown})[] = raw.block.extrinsics
            .map((hex, idx) => {
                let bytes = Buffer.from(hex.slice(2), 'hex')
                let hash = blake2bHash(bytes, 32)
                let ex = decodeExtrinsic(bytes, specInfo.description, specInfo.scaleCodec)
                let {name, args} = unwrapArguments(ex.call, specInfo.calls)
                return {
                    id: formatId(raw.blockHeight, raw.blockHash, idx),
                    block_id,
                    index_in_block: idx,
                    name,
                    signature: ex.signature,
                    success: true,
                    hash,
                    args
                }
            })

        let calls = new CallParser(specInfo, raw.blockHeight, raw.blockHash, events, extrinsics).getCalls()

        return  {
            header: {
                id: block_id,
                height: raw.blockHeight,
                hash: raw.blockHash,
                parent_hash: raw.block.header.parentHash,
                timestamp: new Date(getBlockTimestamp(extrinsics))
            },
            extrinsics,
            events,
            calls
        }
    }

    private async init(): Promise<void> {
        let client = this.clients[0]
        let height = this.initialBlock == 0 ? 0 : this.initialBlock - 1
        let spec = await this.getSpec(client, height)
        if (this.typesBundle == null) {
            this.typesBundle = getOldTypesBundle(spec.specName)
        }
        this._specInfo = await this.getSpecInfo(client, spec.blockHash, spec.specVersion)
    }

    private async getSpecInfo(
        client: ResilientRpcClient,
        blockHash: string,
        specVersion: number
    ): Promise<SpecInfo> {
        let rawMetadata: string = await client.call("state_getMetadata", [blockHash])
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

    private async updateSpecInfo(height: number): Promise<boolean> {
        let rec = this.specs.pop()
        while (rec && rec.blockHeight < height) {
            rec = this.specs.pop()
        }
        if (rec) {
            this.specs.push(rec)
            if (rec.specVersion == this.specInfo.specVersion) {
                return false
            }
        }
        let client = this.clients[0]
        let h = rec == null ? height + 5000 : height + Math.floor((rec.blockHeight - height)/2)
        while (h > height || rec == null) {
            rec = await this.getSpec(client, h)
            this.specs.push(rec)
            if (rec.specVersion == this.specInfo.specVersion) return false
            h = height + Math.floor((h - height)/2)
        }
        this._specInfo = await this.getSpecInfo(client, rec.blockHash, rec.specVersion)
        return true
    }

    private async getSpec(client: ResilientRpcClient, height: number): Promise<BlockSpec> {
        let blockHash = await client.call<string>("chain_getBlockHash", [height])
        let rt = await client.call<sub.RuntimeVersion>('chain_getRuntimeVersion', [blockHash])
        return {
            blockHeight: height,
            blockHash,
            specVersion: rt.specVersion,
            specName: rt.specName
        }
    }

    private get specInfo(): SpecInfo {
        return assertNotNull(this._specInfo)
    }
}


interface RawBlockData {
    blockHash: string
    blockHeight: number
    block: sub.Block
    events?: string | null
}


interface BlockSpec {
    blockHash: string
    blockHeight: number
    specVersion: SpecVersion
    specName: string
}
