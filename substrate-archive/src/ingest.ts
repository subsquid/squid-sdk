import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {Codec} from "@subsquid/scale-codec"
import {
    decodeExtrinsic,
    decodeMetadata,
    getChainDescriptionFromMetadata,
    getOldTypesBundle,
    isPreV14,
    OldTypes,
    OldTypesBundle
} from "@subsquid/substrate-metadata"
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {assertNotNull, wait} from "@subsquid/util-internal"
import assert from "assert"
import {CallParser} from "./callParser"
import {SpecInfo, sub} from "./interfaces"
import {BlockData, Event, Extrinsic, Warning} from "./model"
import {blake2bHash, EVENT_STORAGE_KEY, formatId, getBlockTimestamp, splitSpecId, unwrapArguments} from "./util"


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
    private readonly strideSize = 10
    private specs: BlockSpec[] = []
    private chainHeight = 0

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
            await this.waitForChain()
            this.useIdleClients()
            let blocks = await assertNotNull(this.strides.shift())
            if (blocks instanceof Error) throw blocks
            for (let raw of blocks) {
                let specInfo = this.specInfo
                let block = this.parse(specInfo, raw)
                if (await this.updateSpecInfo(raw.blockHeight) || raw.blockHeight == 0) {
                    let [spec_name, spec_version] = splitSpecId(this.specInfo.specId)
                    block.metadata = {
                        id: this.specInfo.specId,
                        spec_name,
                        spec_version,
                        block_hash: raw.blockHash,
                        block_height: raw.blockHeight,
                        hex: this.specInfo.rawMetadata,
                    }
                }
                block.header.spec_id = this.specInfo.specId
                block.last = this.chainHeight === block.header.height
                yield block
            }
        }
    }

    private async waitForChain(): Promise<void> {
        let client = this.clients[0]
        while (this.chainHeight < this.stridesHead) {
            this.chainHeight = await this.getChainHeight(client)
            if (this.chainHeight >= this.stridesHead) return
            await wait(1000)
        }
    }

    private useIdleClients(): void {
        let client: ResilientRpcClient | undefined
        let vacant = Math.min(
            this.maxStrides - this.strides.length,
            Math.ceil((this.chainHeight - this.stridesHead + 1) / this.strideSize)
        )
        while (vacant > 0 && (client = this.idle.pop())) {
            this.fetchLoop(client).catch()
            vacant -= 1
        }
    }

    private async fetchLoop(client: ResilientRpcClient): Promise<void> {
        while (this.strides.length <= this.maxStrides && this.chainHeight >= this.stridesHead) {
            let size = Math.min(this.strideSize, this.chainHeight - this.stridesHead + 1)
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
            let blockHeight = parseInt(signedBlock.block.header.number)
            assert(blockHeight === height + i)
            result[i] = {
                blockHash,
                blockHeight,
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
                    extrinsic_id,
                    pos: -1
                }
            })

        let extrinsics: (Extrinsic & {name: string, args: unknown})[] = raw.block.extrinsics
            .map((hex, idx) => {
                let bytes = Buffer.from(hex.slice(2), 'hex')
                let hash = blake2bHash(bytes, 32)
                let ex = decodeExtrinsic(bytes, specInfo.description, specInfo.scaleCodec)
                let {name, args} = unwrapArguments(ex.call, specInfo.calls)
                return {
                    id: formatId(raw.blockHeight, raw.blockHash, idx),
                    block_id,
                    index_in_block: idx,
                    success: true,
                    signature: ex.signature,
                    call_id: '',
                    hash,
                    name,
                    args,
                    pos: -1
                }
            })

        let warnings: Warning[] = []

        let calls = new CallParser(
            specInfo,
            raw.blockHeight,
            raw.blockHash,
            events,
            extrinsics,
            warnings
        ).getCalls()

        return  {
            header: {
                id: block_id,
                height: raw.blockHeight,
                hash: raw.blockHash,
                parent_hash: raw.block.header.parentHash,
                timestamp: new Date(getBlockTimestamp(extrinsics)),
                spec_id: '' // to be set later
            },
            extrinsics,
            events,
            calls,
            warnings
        }
    }

    private async init(): Promise<void> {
        let client = this.clients[0]
        let height = this.initialBlock == 0 ? 0 : this.initialBlock - 1
        let spec = await this.getSpec(client, height)
        this._specInfo = await this.getSpecInfo(client, spec.blockHash, spec.specId)
        this.chainHeight = await this.getChainHeight(client)
    }

    private async getSpecInfo(
        client: ResilientRpcClient,
        blockHash: string,
        specId: string
    ): Promise<SpecInfo> {
        let rawMetadata: string = await client.call("state_getMetadata", [blockHash])
        let metadata = decodeMetadata(rawMetadata)
        let oldTypes: OldTypes | undefined
        if (isPreV14(metadata)) {
            let [specName, specVersion] = splitSpecId(specId)
            let typesBundle = assertNotNull(
                this.typesBundle || getOldTypesBundle(specName),
                `types bundle is required for ${specName} chain`
            )
            oldTypes = getTypesFromBundle(typesBundle, specVersion)
        }
        let description = getChainDescriptionFromMetadata(metadata, oldTypes)
        return {
            specId,
            description,
            rawMetadata,
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
            if (rec.specId == this.specInfo.specId) {
                return false
            }
        }
        let client = this.clients[0]
        let h = rec == null ? Math.min(height + 5000, this.chainHeight) : height + Math.floor((rec.blockHeight - height)/2)
        while (rec == null || rec.blockHeight > height) {
            rec = await this.getSpec(client, h)
            this.specs.push(rec)
            if (rec.specId == this.specInfo.specId) return false
            h = height + Math.floor((h - height)/2)
        }
        this._specInfo = await this.getSpecInfo(client, rec.blockHash, rec.specId)
        return true
    }

    private async getSpec(client: ResilientRpcClient, height: number): Promise<BlockSpec> {
        let blockHash = await client.call<string>("chain_getBlockHash", [height])
        let rt = await client.call<sub.RuntimeVersion>('chain_getRuntimeVersion', [blockHash])
        return {
            blockHeight: height,
            blockHash,
            specId: `${rt.specName}@${rt.specVersion}`
        }
    }

    private async getChainHeight(client: ResilientRpcClient): Promise<number> {
        let hash = await client.call('chain_getFinalizedHead')
        let header = await client.call<sub.BlockHeader>('chain_getHeader', [hash])
        let height = parseInt(header.number)
        assert(Number.isSafeInteger(height))
        return height
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
    specId: string
}
