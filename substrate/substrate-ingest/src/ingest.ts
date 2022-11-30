import type {Logger} from '@subsquid/logger'
import {Codec, HexSink, Src} from '@subsquid/scale-codec'
import {
    decodeMetadata,
    getChainDescriptionFromMetadata,
    getOldTypesBundle,
    isPreV14,
    OldSpecsBundle,
    OldTypes,
    OldTypesBundle
} from '@subsquid/substrate-metadata'
import * as eac from '@subsquid/substrate-metadata/lib/events-and-calls'
import {getTypesFromBundle} from '@subsquid/substrate-metadata/lib/old/typesBundle'
import {assertNotNull, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {Client} from './client'
import {Spec, sub} from './interfaces'
import {BlockData} from './model'
import {parseRawBlock, RawBlock} from './parse/block'
import {Account} from './parse/validator'
import {Shooter} from './shooter'
import {
    addErrorContext,
    EVENT_STORAGE_KEY,
    NEXT_FEE_MULTIPLIER_STORAGE_KEY,
    SESSION_STORAGE_KEY,
    splitSpecId,
    VALIDATORS_STORAGE_KEY,
    withErrorContext
} from './util'


export interface IngestOptions {
    client: Client
    typesBundle?: OldTypesBundle | OldSpecsBundle
    startBlock?: number
    log?: Logger
}


export class Ingest {
    static getBlocks(options: IngestOptions): AsyncGenerator<BlockData> {
        return new Ingest(options).loop()
    }

    private client: Client
    private typesBundle?: OldTypesBundle | OldSpecsBundle
    private maxStrides = 20
    private readonly strideSize = 10
    private log?: Logger

    private stridesHead: number
    private strides: Promise<RawBlock[] | Error>[] = []
    private chainHeight = 0
    private specs = this.createSpecsShooter()
    private validators = this.createValidatorsShooter()
    private firstBlock = true

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
                try {
                    yield await this.processRawBlock(raw)
                } catch(e: any) {
                    throw addErrorContext(e, {
                        blockHeight: raw.blockHeight,
                        blockHash: raw.blockHash
                    })
                }
            }
        }
    }

    private async processRawBlock(raw: RawBlock): Promise<BlockData> {
        let prevSpec = await this.specs.get(Math.max(0, raw.blockHeight - 1))
        let validators = await this.validators.get(raw.blockHeight)
        let block = parseRawBlock(prevSpec, validators, raw)
        let currentSpec = await this.specs.get(raw.blockHeight)
        if (raw.blockHeight == 0 || currentSpec.specId != prevSpec.specId) {
            let [spec_name, spec_version] = splitSpecId(currentSpec.specId)
            block.metadata = {
                id: currentSpec.specId,
                spec_name,
                spec_version,
                block_hash: raw.blockHash,
                block_height: raw.blockHeight,
                hex: currentSpec.rawMetadata,
            }
        } else if (this.firstBlock) {
            let [spec_name, spec_version] = splitSpecId(prevSpec.specId)
            block.metadata = {
                id: prevSpec.specId,
                spec_name,
                spec_version,
                block_hash: await this.getBlockHash(raw.blockHeight - 1),
                block_height: raw.blockHeight - 1,
                hex: prevSpec.rawMetadata
            }
        }
        this.firstBlock = false
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
        let blocks = new Array<sub.Block>(size)
        let hashes = new Array<string>(size)
        let storagePromises = new Array<Promise<Error | any[]>>(size)

        let last = height + size - 1
        let blockHash = await this.getBlockHash(last, height)

        for (let i = size - 1; i >= 0; i--) {
            let blockHeight = height + i

            hashes[i] = blockHash

            storagePromises[i] = this.queryStorageAt(
                blockHash,
                [
                    EVENT_STORAGE_KEY,
                    NEXT_FEE_MULTIPLIER_STORAGE_KEY
                ],
                blockHeight
            ).catch((err: Error) => {
                return addErrorContext(err, {
                    blockHeight,
                    blockHash
                })
            })

            let block = await this.client
                .call<sub.SignedBlock>(height, "chain_getBlock", [blockHash])
                .catch(withErrorContext({
                    blockHeight,
                    blockHash
                }))

            blocks[i] = block.block
            blockHash = block.block.header.parentHash
            assert(parseInt(block.block.header.number) === blockHeight)
        }

        let storage = await Promise.all(storagePromises)
        let result = new Array<RawBlock>(size)
        for (let i = 0; i < size; i++) {
            let s = storage[i]
            if (s instanceof Error) throw s
            let [events, feeMultiplier] = s
            result[i] = {
                blockHeight: height + i,
                blockHash: hashes[i],
                block: blocks[i],
                events,
                feeMultiplier
            }
        }
        return result
    }

    private getBlockHash(blockHeight: number, priority?: number): Promise<string> {
        return this.client
            .call<string>(priority ?? blockHeight, "chain_getBlockHash", [blockHeight])
            .catch(withErrorContext({
                blockHeight
            }))
    }

    private createValidatorsShooter() {
        return new Shooter(
            5000,
            height => this.getSessionIndex(height).catch(withErrorContext({blockHeight: height})),
            id => this.getValidators(id.blockHash).catch(withErrorContext({blockHash: id.blockHash})),
            (a, b) => a.index === b.index,
            () => this.chainHeight
        )
    }

    private async getValidators(blockHash: string): Promise<Account[]> {
        let raw = await this.client.call('state_getStorage', [VALIDATORS_STORAGE_KEY, blockHash])
        if (raw == null) return []
        let src = new Src(raw)
        let len = src.compactLength()
        if (len == 0) return []
        let sink = new HexSink()
        sink.compact(len)
        let prefix = sink.toHex()
        let addressSize = (raw.length - prefix.length) / (2 * len)
        assert(Number.isSafeInteger(addressSize))
        let validators = new Array(len)
        for (let i = 0; i < len; i++) {
            validators[i] = src.bytes(addressSize)
        }
        return validators
    }

    private async getSessionIndex(height: number): Promise<SessionId> {
        let blockHash = await this.getBlockHash(height)
        let index = await this.client.call('state_getStorage', [SESSION_STORAGE_KEY, blockHash])
        return {blockHash, index}
    }

    private createSpecsShooter() {
        return new Shooter(
            5000,
            height => this.getBlockSpecId(height).catch(withErrorContext({
                blockHeight: height
            })),
            id => this.fetchSpec(id).catch(withErrorContext({
                blockHash: id.blockHash
            })),
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
            oldTypes = getTypesFromBundle(typesBundle, specVersion, specName)
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
        let blockHash = await this.getBlockHash(height)
        let rt = await this.client.call<sub.RuntimeVersion>(height, 'chain_getRuntimeVersion', [blockHash])
        return {
            blockHash,
            specId: `${rt.specName}@${rt.specVersion}`
        }
    }

    private async getChainHeight(): Promise<number> {
        let hash = await this.client.call('chain_getFinalizedHead')
        return this.client.call<sub.BlockHeader>('chain_getHeader', [hash])
            .then(header => {
                let height = parseInt(header.number)
                assert(Number.isSafeInteger(height))
                return height
            }).catch(withErrorContext({
                blockHash: hash
            }))
    }

    private async queryStorageAt(blockHash: string, keys: string[], priority: number = 0): Promise<any[]> {
        if (keys.length == 0) return []
        let res: {changes: [key: string, value: string][]}[] = await this.client.call(
            priority,
            'state_queryStorageAt',
            [keys, blockHash]
        )
        assert(res.length == 1)
        let changes = res[0].changes
        assert(changes.length == keys.length)
        let values = new Array(keys.length)
        for (let i = 0; i < values.length; i++) {
            let [k, v] = changes[i]
            assert(k == keys[i])
            values[i] = v
        }
        return values
    }
}


interface BlockSpecId {
    blockHash: string
    specId: string
}


interface SessionId {
    blockHash: string
    index: unknown
}
