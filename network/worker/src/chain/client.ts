import {ResilientRpcClient} from '@subsquid/rpc-client/lib/resilient'
import {Codec as ScaleCodec} from '@subsquid/scale-codec'
import {ChainDescription, decodeMetadata, getChainDescriptionFromMetadata} from '@subsquid/substrate-metadata'
import {def} from '@subsquid/util-internal'
import {definitions, GlobalEnum} from './definitions'
import {Call, Event} from './interface'
import {KeyPair} from './keyPair'
import {Async, FIFOCache} from './util'


export type BlockHash = string


export interface BlockHeader {
    height: number
    hash: BlockHash
    parentHash: BlockHash
}


export interface Transaction {
    call: Call
    signer?: KeyPair
    nonce?: bigint
    tip?: bigint
}


interface RuntimeVersion {
    specName: string
    specVersion: number
    transactionVersion: number
}


interface BlockInfo {
    hash: BlockHash
    header?: Async<BlockHeader>
    runtimeVersion?: Async<RuntimeVersion>
    meta?: Async<Meta>
}


export interface ClientOptions {
    url: string
}


export class Client {
    private rpc: ResilientRpcClient
    private knownBlocks = new FIFOCache<BlockInfo>(50)

    constructor(options: ClientOptions) {
        this.rpc = new ResilientRpcClient(options.url)
    }

    async getBlockHeader(hash: BlockHash): Promise<BlockHeader> {
        let info = this.getBlockInfo(hash)
        return this.addHeader(info)
    }

    private getBlockInfo(hash: BlockHash): BlockInfo {
        let info = this.knownBlocks.find(i => i.hash == hash)
        if (info) return info
        info = {hash}
        this.knownBlocks.push(info)
        return info
    }

    private addHeader(info: BlockInfo): Async<BlockHeader> {
        if (info.header == null) {
            info.header = this.fetchBlockHeader(info.hash)
        }
        return info.header
    }

    private async fetchBlockHeader(hash: string): Promise<BlockHeader> {
        let raw: {number: string, parentHash: string} = await this.rpc.call('chain_getHeader', [hash])
        return {
            height: parseInt(raw.number),
            hash,
            parentHash: raw.parentHash
        }
    }

    async getEvents(block: BlockHash | BlockHeader): Promise<Event[]> {
        let hash = typeof block == 'string' ? block : block.hash
        let [meta, raw] = await Promise.all([
            this.getMetaFor(block),
            this.rpc.call('state_getStorage', [
                '0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7',
                hash
            ])
        ])
        return meta.decodeEventStorageValue(raw).map(e => {
            return definitions.flatten('event', e.event)
        })
    }

    private async getMetaFor(block: BlockHash | BlockHeader): Promise<Meta> {
        let header = typeof block == 'string' ? await this.getBlockHeader(block) : block
        let parent = this.getBlockInfo(header.parentHash)
        return this.addMeta(parent)
    }

    private addRuntimeVersion(info: BlockInfo): Async<RuntimeVersion> {
        if (info.runtimeVersion == null) {
            info.runtimeVersion = this.fetchRuntimeVersion(info.hash)
        }
        return info.runtimeVersion
    }

    private fetchRuntimeVersion(blockHash: string): Promise<RuntimeVersion> {
        return this.rpc.call('state_getRuntimeVersion', [blockHash])
    }

    private async addMeta(info: BlockInfo): Promise<Meta> {
        if (info.meta) return info.meta

        let runtimeVersion = await this.addRuntimeVersion(info)
        if (info.meta) return info.meta

        let sameSpec = this.knownBlocks.find(i => {
            return sameSpecVersion(runtimeVersion, i.runtimeVersion) && i.meta
        })

        return info.meta = sameSpec?.meta || this.fetchMeta(info.hash)
    }

    private async fetchMeta(blockHash: string): Promise<Meta> {
        let rawMetadata = await this.rpc.call('state_getMetadata', [blockHash])
        let meta = decodeMetadata(rawMetadata)
        let description = getChainDescriptionFromMetadata(meta)
        definitions.checkChainDescription(description)
        return new Meta(description)
    }

    getBestBlockHash(): Promise<string> {
        return this.rpc.call('chain_getBlockHash')
    }

    @def
    getGenesisHash(): Promise<string> {
        return this.rpc.call('chain_getBlockHash', [0])
    }

    async send(tx: Transaction): Promise<string> {
        let info = this.getBlockInfo(await this.getBestBlockHash())
        let runtimeVersion = await this.addRuntimeVersion(info)
        let meta = await this.addMeta(info)
        throw new Error('Not implemented')
    }
}


function sameSpecVersion(a: RuntimeVersion, b?: Async<RuntimeVersion>): boolean {
    let other = b as any
    return other && a.specName === other.specName && a.specVersion === other.specVersion
}


class Meta {
    public readonly codec: ScaleCodec

    constructor(public readonly description: ChainDescription) {
        this.codec = new ScaleCodec(description.types)
    }

    decodeEventStorageValue(raw: string | Uint8Array): {event: GlobalEnum}[] {
        return this.codec.decodeBinary(this.description.eventRecordList, raw)
    }
}
