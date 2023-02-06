import {blake2b} from '@polkadot/wasm-crypto'
import {xxhashAsU8a} from '@polkadot/util-crypto'
import {ResilientRpcClient} from '@subsquid/rpc-client/lib/resilient.js'
import {ByteSink, Codec as ScaleCodec, HexSink, Src} from '@subsquid/scale-codec'
import * as ss58 from '@subsquid/ss58-codec'
import {ChainDescription, decodeMetadata, getChainDescriptionFromMetadata} from '@subsquid/substrate-metadata'
import {def} from '@subsquid/util-internal'
import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import assert from 'assert'
import {Async, FIFOCache, initCrypto} from '../util.js'
import {definitions, GlobalEnum, toGlobalEnum} from './definitions.js'
import {Call, Event} from './interface.js'
import {KeyPair} from './keyPair.js'


export type BlockHash = string
export type Address = string // Account address in SS58 format


export interface BlockHeader {
    height: number
    hash: BlockHash
    parentHash: BlockHash
}


export interface Transaction {
    call: Call
    author?: KeyPair
    nonce?: number
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
        this.rpc = new ResilientRpcClient({url: options.url})
    }

    async getHeader(blockHash: string): Promise<BlockHeader> {
        let info = this.getBlockInfo(blockHash)
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
        let header = typeof block == 'string' ? await this.getHeader(block) : block
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

    getHead(): Promise<string> {
        return this.rpc.call('chain_getBlockHash')
    }

    getFinalizedHead(): Promise<string> {
        return this.rpc.call('chain_getFinalizedHead')
    }

    @def
    getGenesisHash(): Promise<string> {
        return this.rpc.call('chain_getBlockHash', [0])
    }

    @def
    async getBinaryGenesisHash(): Promise<Uint8Array> {
        return decodeHex(await this.getGenesisHash())
    }

    async send(tx: Transaction): Promise<string> {
        assert(tx.author, 'Unsigned transactions are not supported')

        let info = this.getBlockInfo(await this.getHead())
        let runtimeVersion = await this.addRuntimeVersion(info)
        let meta = await this.addMeta(info)

        let callBytes = meta.encodeCall(toGlobalEnum(tx.call))

        let nonce = tx.nonce ?? await this.getAccountNonce(
            ss58.encode({
                bytes: tx.author.getPublicKey(),
                prefix: meta.getConstant('System', 'SS58Prefix')
            })
        )

        let genesis = await this.getBinaryGenesisHash()

        // TODO: use metadata for correct encoding and sane compatibility errors
        let bytesToSign: Uint8Array
        {
            let sink = new ByteSink()
            sink.bytes(callBytes)
            sink.u8(0) // immortal era
            sink.compact(nonce)
            sink.compact(tx.tip ?? 0)
            sink.u32(runtimeVersion.specVersion)
            sink.u32(runtimeVersion.transactionVersion)
            sink.bytes(genesis)
            sink.bytes(genesis)
            bytesToSign = sink.toBytes()
        }

        await initCrypto()

        if (bytesToSign.length > 256) {
            bytesToSign = blake2b(bytesToSign, new Uint8Array(), 32)
        }

        let signature = tx.author.sign(bytesToSign)

        let extrinsic: Uint8Array
        {
            let sink = new ByteSink()
            sink.u8(0b10000000 + 4)
            sink.u8(0) // Id
            sink.bytes(tx.author.getPublicKey())
            sink.u8(tx.author.signatureType)
            sink.bytes(signature)
            sink.u8(0) // immortal era
            sink.compact(nonce)
            sink.compact(tx.tip ?? 0)
            sink.bytes(callBytes)
            extrinsic = sink.toBytes()
        }

        let payload: string
        {
            let sink = new HexSink()
            sink.compact(extrinsic.length)
            sink.bytes(extrinsic)
            payload = sink.toHex()
        }

        return this.rpc.call('author_submitExtrinsic', [payload])
    }

    async getAccountNonce(address: Address): Promise<number> {
        return this.rpc.call('system_accountNextIndex', [address])
    }

    async getTimestamp(blockHash: string): Promise<number> {
        let raw = await this.rpc.call('state_getStorage', [
            '0xf0c365c3cf59d671eb72da0e7a4113c49f1f0515f462cdcf84e0f1d6045dfcbb',
            blockHash
        ])
        let src = new Src(raw)
        let ts = src.u64()
        src.assertEOF()
        return Number(ts)
    }

    async getStorageItem(blockHash: string, module: string, method: string, encodedKey: Uint8Array): Promise<any> {
        let fullStorageKey = toHex(Buffer.concat([
            xxhashAsU8a(module, 128),
            xxhashAsU8a(method, 128),
            encodedKey
        ]))

        let raw = await this.rpc.call('state_getStorage', [fullStorageKey])
        if (raw === null) {
            return null
        }

        let src = new Src(raw)
        let meta = await this.fetchMeta(blockHash)
        let type_info = meta.description.storage[module][method].value
        return meta.codec.decode(type_info, src)
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

    getConstant(pallet: string, name: string): any {
        let def = this.description.constants[pallet]?.[name]
        if (def == null) {
            throw new Error(`Constant ${pallet}.${name} is not defined`)
        }
        return this.codec.decodeBinary(def.type, def.value)
    }

    encodeCall(call: GlobalEnum): Uint8Array {
        return this.codec.encodeToBinary(this.description.call, call)
    }
}
