import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {Codec as ScaleCodec} from "@subsquid/scale-codec"
import {Codec as JsonCodec} from "@subsquid/scale-codec-json"
import {throwUnexpectedCase} from "@subsquid/scale-codec/lib/util"
import {
    ChainDescription,
    decodeMetadata,
    Field,
    getChainDescriptionFromMetadata,
    getOldTypesBundle,
    OldTypes,
    OldTypesBundle,
    QualifiedName,
    SpecVersion,
    StorageItem
} from "@subsquid/substrate-metadata"
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {getStorageItemTypeHash} from "@subsquid/substrate-metadata/lib/storage"
import {assertNotNull} from "@subsquid/util"
import assert from "assert"
import type {SubstrateRuntimeVersion} from "./interfaces/substrate"
import * as sto from "./util/storage"


/**
 * Subset of SubstrateBlock properties required for getting
 * chain metadata for a given block
 */
interface BlockInfo {
    height: number
    hash: string
    parentHash: string
    runtimeVersion: SpecVersion | SubstrateRuntimeVersion
}


export class ChainManager {
    private versions = new Map<SpecVersion, {height: number, chain: Chain}>()

    constructor(
        private client: ResilientRpcClient,
        private typesBundle?: OldTypesBundle) {
    }

    async getChainForBlock(block: BlockInfo): Promise<Chain> {
        let specVersion = typeof block.runtimeVersion == 'number'
            ? block.runtimeVersion
            : block.runtimeVersion.specVersion

        let v = this.versions.get(specVersion)
        if (v != null && v.height < block.height) return v.chain

        let height = Math.max(0, block.height - 1)
        let hash = height > 0 ? block.parentHash : block.hash
        let rtv: SubstrateRuntimeVersion = await this.client.call('chain_getRuntimeVersion', [hash])
        v = this.versions.get(rtv.specVersion)
        if (v == null) {
            let metadataHex: string = await this.client.call('state_getMetadata', [hash])
            v = this.versions.get(rtv.specVersion) // perhaps it was fetched
            if (v == null) {
                let chain = this.createChain(rtv, metadataHex)
                v = {chain, height}
                this.versions.set(rtv.specVersion, v)
            }
        }
        v.height = Math.min(v.height, height)
        return v.chain
    }

    private createChain(rtv: SubstrateRuntimeVersion, metadataHex: string): Chain {
        let metadata = decodeMetadata(metadataHex)
        let types: OldTypes | undefined
        if (parseInt(metadata.__kind.slice(1)) < 14) {
            let typesBundle = assertNotNull(
                this.typesBundle || getOldTypesBundle(rtv.specName),
                `types bundle is required for ${rtv.specName} chain`
            )
            types = getTypesFromBundle(typesBundle, rtv.specVersion)
        }
        let description = getChainDescriptionFromMetadata(metadata, types)
        return new Chain(description, this.client)
    }
}


export class Chain {
    private jsonCodec: JsonCodec
    private scaleCodec: ScaleCodec
    private events: eac.Registry
    private calls: eac.Registry
    private storageHash = Symbol('storage_hash')

    constructor(
        public readonly description: ChainDescription,
        private client: ResilientRpcClient
    ) {
        this.jsonCodec = new JsonCodec(description.types)
        this.scaleCodec = new ScaleCodec(description.types)
        this.events = new eac.Registry(description.types, description.event)
        this.calls = new eac.Registry(description.types, description.call, true)
    }

    getEventHash(eventName: QualifiedName): string {
        return this.events.getHash(eventName)
    }

    getCallHash(callName: QualifiedName): string {
        return this.calls.getHash(callName)
    }

    decodeEvent(event: {name: string, params: {value: unknown}[]}): any {
        let def = this.events.get(event.name)
        return this.decode(def, event.params)
    }

    decodeCall(call: {name: string, args: {value: unknown}[]}): any {
        let def = this.calls.get(call.name)
        return this.decode(def, call.args)
    }

    private decode(def: eac.Definition, args: {value: unknown}[]): any {
        if (def.fields.length == 0) return undefined
        if (def.fields[0].name == null) return this.decodeTuple(def.fields, args)
        let result: any = {}
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i]
            let name = assertNotNull(f.name)
            result[name] = this.jsonCodec.decode(f.type, args[i].value)
        }
        return result
    }

    private decodeTuple(fields: Field[], values: {value: unknown}[]): any {
        if (fields.length == 1) {
            return this.jsonCodec.decode(fields[0].type, values[0].value)
        } else {
            assert(fields.length == values.length, 'invalid event data')
            let result: any[] = new Array(fields.length)
            for (let i = 0; i < fields.length; i++) {
                result[i] = this.jsonCodec.decode(fields[i].type, values[i].value)
            }
            return result
        }
    }

    async getStorage(blockHash: string, prefix: string, name: string, ...keys: any[]) {
        let item = this.getStorageItem(prefix, name)
        assert(item.keys.length === keys.length)
        let req = sto.getNameHash(prefix) + sto.getNameHash(name).slice(2)
        for (let i = 0; i < keys.length; i++) {
            req += sto.getKeyHash(
                item.hashers[i],
                this.scaleCodec.encodeToBinary(item.keys[i], keys[i])
            ).slice(2)
        }
        let res = await this.client.call('state_getStorageAt', [req, blockHash])
        if (res == null) {
            switch(item.modifier) {
                case 'Optional':
                    return undefined
                case 'Default':
                    res = item.fallback
                    break
                case 'Required':
                    throw new Error(`Required storage item not found`)
                default:
                    throwUnexpectedCase(item.modifier)
            }
        }
        return this.scaleCodec.decodeBinary(item.value, res)
    }

    private getStorageItem(prefix: string, name: string): StorageItem {
        let items = this.description.storage[prefix]
        if (items == null) throw new Error(
            `There are no storage items under prefix ${prefix}`
        )
        let def = items[name]
        if (def == null) throw new Error(
            `Unknown storage item: ${prefix}.${name}`
        )
        return def
    }

    getStorageItemTypeHash(prefix: string, name: string): string | undefined {
        let item = this.description.storage[prefix]?.[name]
        if (item == null) return undefined
        let hash = (item as any)[this.storageHash]
        if (hash == null) {
            hash = (item as any)[this.storageHash] = getStorageItemTypeHash(this.description.types, item)
        }
        return hash
    }
}
