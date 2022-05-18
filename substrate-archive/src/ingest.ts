import type {Logger} from "@subsquid/logger"
import {Codec} from "@subsquid/scale-codec"
import {
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
import {Client} from "./client"
import {Spec, sub} from "./interfaces"
import {BlockData} from "./model"
import {parseRawBlock, RawBlock} from "./parse/block"
import {Shooter} from "./shooter"
import {EVENT_STORAGE_KEY, splitSpecId} from "./util"


export interface IngestOptions {
    client: Client
    typesBundle?: OldTypesBundle
    startBlock?: number
    log?: Logger
}


export class Ingest {
    static getBlocks(options: IngestOptions): AsyncGenerator<BlockData> {
        return new Ingest(options).loop()
    }

    private client: Client
    private typesBundle?: OldTypesBundle
    private maxStrides = 10
    private readonly strideSize = 10
    private log?: Logger

    private stridesHead: number
    private strides: Promise<RawBlock[] | Error>[] = []
    private chainHeight = 0
    private specs = this.createSpecsShooter()

    private constructor(options: IngestOptions) {
        this.client = options.client
        this.typesBundle = options.typesBundle
        if (options.startBlock) {
            assert(options.startBlock >= 0)
            this.stridesHead = options.startBlock
        } else {
            this.stridesHead = 0
        }
        this.log = options.log
    }

    private async *loop(): AsyncGenerator<BlockData> {
        this.chainHeight = await this.getChainHeight()
        this.log?.info(`chain height is ${this.chainHeight}`)
        while (true) {
            if (this.strides.length == 0) {
                await this.waitForChain()
            }
            this.scheduleStrides()
            let blocks = await assertNotNull(this.strides.shift())
            if (blocks instanceof Error) throw blocks
            for (let raw of blocks) {
                yield await this.processRawBlock(raw)
            }
        }
    }

    private async processRawBlock(raw: RawBlock): Promise<BlockData> {
        let prevSpec = await this.specs.get(Math.max(0, raw.blockHeight - 1))
        let block = parseRawBlock(prevSpec, raw)
        let currentSpec = await this.specs.get(raw.blockHeight)
        if (currentSpec.specId != prevSpec.specId) {
            let [spec_name, spec_version] = splitSpecId(currentSpec.specId)
            block.metadata = {
                id: currentSpec.specId,
                spec_name,
                spec_version,
                block_hash: raw.blockHash,
                block_height: raw.blockHeight,
                hex: currentSpec.rawMetadata,
            }
        }
        block.header.spec_id = currentSpec.specId
        block.last = this.chainHeight === block.header.height
        return block
    }

    private async waitForChain(): Promise<void> {
        while (this.chainHeight < this.stridesHead) {
            this.chainHeight = await this.getChainHeight()
            if (this.chainHeight >= this.stridesHead) return
            await wait(1000)
        }
    }

    private scheduleStrides(): void {
        while (this.strides.length <= this.maxStrides && this.chainHeight >= this.stridesHead) {
            let size = Math.min(this.strideSize, this.chainHeight - this.stridesHead + 1)
            let height = this.stridesHead
            this.stridesHead += size
            let promise = this.fetchStride(height, size).catch(err => err)
            this.strides.push(promise)
        }
    }

    private async fetchStride(height: number, size: number): Promise<RawBlock[]> {
        assert(size > 0)
        let last = height + size - 1
        let blockHash =  await this.client.call<string>(height, "chain_getBlockHash", [last])
        let result: RawBlock[] = new Array(size)
        for (let i = size - 1; i >= 0; i--) {
            let [signedBlock, events] = await Promise.all([
                this.client.call<sub.SignedBlock>(height, "chain_getBlock", [blockHash]),
                this.client.call<string>(height, "state_getStorageAt", [EVENT_STORAGE_KEY, blockHash])
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

    private createSpecsShooter() {
        return new Shooter(
            5000,
            height => this.getBlockSpecId(height),
            id => this.fetchSpec(id),
            (a, b) => a.specId === b.specId,
            () => this.chainHeight
        )
    }

    private async fetchSpec(id: BlockSpecId): Promise<Spec> {
        let rawMetadata: string = await this.client.call("state_getMetadata", [id.blockHash])
        let metadata = decodeMetadata(rawMetadata)
        let oldTypes: OldTypes | undefined
        if (isPreV14(metadata)) {
            let [specName, specVersion] = splitSpecId(id.specId)
            let typesBundle = assertNotNull(
                this.typesBundle || getOldTypesBundle(specName),
                `types bundle is required for ${specName} chain`
            )
            oldTypes = getTypesFromBundle(typesBundle, specVersion)
        }
        let description = getChainDescriptionFromMetadata(metadata, oldTypes)
        return {
            specId: id.specId,
            description,
            rawMetadata,
            scaleCodec: new Codec(description.types),
            events: new eac.Registry(description.types, description.event),
            calls: new eac.Registry(description.types, description.call)
        }
    }

    private async getBlockSpecId(height: number): Promise<BlockSpecId> {
        let blockHash = await this.client.call<string>(height, "chain_getBlockHash", [height])
        let rt = await this.client.call<sub.RuntimeVersion>(height, 'chain_getRuntimeVersion', [blockHash])
        return {
            blockHash,
            specId: `${rt.specName}@${rt.specVersion}`
        }
    }

    private async getChainHeight(): Promise<number> {
        let hash = await this.client.call('chain_getFinalizedHead')
        let header = await this.client.call<sub.BlockHeader>('chain_getHeader', [hash])
        let height = parseInt(header.number)
        assert(Number.isSafeInteger(height))
        return height
    }
}


interface BlockSpecId {
    blockHash: string
    specId: string
}
