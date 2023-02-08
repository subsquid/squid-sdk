import {Codec as ScaleCodec, JsonCodec, Src} from '@subsquid/scale-codec'
import {
    ChainDescription,
    Constant,
    decodeMetadata,
    Field,
    getChainDescriptionFromMetadata,
    getTypeHash,
    isPreV14,
    OldTypes,
    QualifiedName,
    StorageItem
} from '@subsquid/substrate-metadata'
import * as eac from '@subsquid/substrate-metadata/lib/events-and-calls'
import {getStorageItemTypeHash} from '@subsquid/substrate-metadata/lib/storage'
import {assertNotNull, last, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import type {SpecId} from './interfaces/substrate'
import * as sto from './util/storage'


/**
 * Subset of SubstrateBlock properties required for getting
 * chain metadata for a given block
 */
interface BlockInfo {
    height: number
    specId: SpecId
}


interface SpecMetadata {
    id: SpecId
    specName: string
    specVersion: number
    blockHeight: number
    hex: string
}


interface RpcClient {
    call<T=any>(method: string, params?: unknown[]): Promise<T>
}


export interface ChainManagerOptions {
    archiveRequest<T>(query: string): Promise<T>
    getChainClient: () => RpcClient
    getTypes: (meta: SpecMetadata) => OldTypes
}


export class ChainManager {
    private versions = new Map<SpecId, {height: number, chain: Chain}>()

    constructor(private options: ChainManagerOptions) {}

    async getChainForBlock(block: BlockInfo): Promise<Chain> {
        let v = this.versions.get(block.specId)
        if (v != null && v.height < block.height) return v.chain

        let height = Math.max(0, block.height - 1)
        let specId = await this.getSpecId(height)
        v = this.versions.get(specId)
        if (v == null) {
            let meta = await this.getSpecMetadata(specId)
            v = this.versions.get(specId) // perhaps it was fetched
            if (v == null) {
                let chain = this.createChain(meta)
                v = {chain, height: meta.blockHeight}
                this.versions.set(specId, v)
            }
        }
        return v.chain
    }

    private createChain(meta: SpecMetadata): Chain {
        let metadata = decodeMetadata(meta.hex)
        let types: OldTypes | undefined
        if (isPreV14(metadata)) {
            types = this.options.getTypes(meta)
        }
        let description = getChainDescriptionFromMetadata(metadata, types)
        return new Chain(description, () => this.options.getChainClient())
    }

    private async getSpecId(height: number): Promise<SpecId> {
        let res: {batch: {header: {specId: string}}[]} = await this.options.archiveRequest(`
            query {
                batch(fromBlock: ${height} toBlock: ${height} includeAllBlocks: true limit: 1) {
                    header {
                        specId
                    }
                }
            }
        `)
        if (res.batch.length == 0) throw new Error(`Block ${height} not found in archive`)
        assert(res.batch.length === 1)
        return res.batch[0].header.specId
    }

    private getSpecMetadata(specId: SpecId): Promise<SpecMetadata> {
        return this.options.archiveRequest<{metadataById: SpecMetadata | null}>(`
            query {
                metadataById(id: "${specId}") {
                    id
                    specName
                    specVersion
                    blockHeight
                    hex
                }
            }
        `).then(res => {
            if (res.metadataById == null) {
                throw new Error(`Metadata for spec ${specId} not found in archive`)
            } else {
                return res.metadataById
            }
        })
    }
}


export class Chain {
    private jsonCodec: JsonCodec
    private scaleCodec: ScaleCodec
    private events: eac.Registry
    private calls: eac.Registry
    private storageHashCache = new Map<StorageItem, string>()
    private constantValueCache = new Map<Constant, any>()

    constructor(
        public readonly description: ChainDescription,
        private getClient: () => RpcClient
    ) {
        this.jsonCodec = new JsonCodec(description.types)
        this.scaleCodec = new ScaleCodec(description.types)
        this.events = new eac.Registry(description.types, description.event)
        this.calls = new eac.Registry(description.types, description.call)
    }

    get client(): RpcClient {
        return this.getClient()
    }

    getEventHash(eventName: QualifiedName): string {
        return this.events.getHash(eventName)
    }

    getCallHash(callName: QualifiedName): string {
        return this.calls.getHash(callName)
    }

    decodeEvent(event: {name: string, args: any}): any {
        let def = this.events.get(event.name)
        return this.decode(def, event.args)
    }

    decodeCall(call: {name: string, args: any}): any {
        let def = this.calls.get(call.name)
        return this.decode(def, call.args)
    }

    private decode(def: eac.Definition, args: any): any {
        if (def.fields.length == 0) return undefined
        if (def.fields[0].name == null) return this.decodeTuple(def.fields, args)
        assert(args != null && typeof args == 'object', 'invalid args')
        let result: any = {}
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i]
            let name = assertNotNull(f.name)
            result[name] = this.jsonCodec.decode(f.type, args[name])
        }
        return result
    }

    private decodeTuple(fields: Field[], args: unknown): any {
        if (fields.length == 1) {
            return this.jsonCodec.decode(fields[0].type, args)
        } else {
            assert(Array.isArray(args) && fields.length == args.length, 'invalid args')
            let result: any[] = new Array(fields.length)
            for (let i = 0; i < fields.length; i++) {
                result[i] = this.jsonCodec.decode(fields[i].type, args[i])
            }
            return result
        }
    }

    async getStorage(blockHash: string, prefix: string, name: string, ...keys: any[]) {
        let item = this.getStorageItem(prefix, name)
        assert(item.keys.length === keys.length)
        let req = sto.getNameHash(prefix) + sto.getNameHash(name).slice(2) + this.getStorageItemKeysHash(item, keys)
        let res = await this.client.call('state_getStorageAt', [req, blockHash])
        return this.decodeStorageValue(item, res)
    }

    async queryStorage(blockHash: string, prefix: string, name: string, keyList?: any[][]): Promise<any[]> {
        let item = this.getStorageItem(prefix, name)
        let storageHash = sto.getNameHash(prefix) + sto.getNameHash(name).slice(2)

        let query: string[]
        if (keyList == null) {
            query = await this.client.call('state_getKeys', [storageHash, blockHash])
        } else {
            query = keyList.map(keys => {
                return storageHash + this.getStorageItemKeysHash(item, keys)
            })
        }

        return this.fetchValues(blockHash, item, query)
    }

    async queryStorage2(blockHash: string, prefix: string, name: string, keys?: any[]): Promise<any[]> {
        let item = this.getStorageItem(prefix, name)
        let storageHash = sto.getNameHash(prefix) + sto.getNameHash(name).slice(2)

        let query: string[]
        if (keys == null) {
            query = await this.client.call('state_getKeys', [storageHash, blockHash])
        } else {
            query = keys.map(arg => {
                return storageHash + this.getStorageItemKeysHash(item, item.keys.length > 1 ? arg : [arg])
            })
        }

        return this.fetchValues(blockHash, item, query)
    }

    private async fetchValues(blockHash: string, item: StorageItem, rawKeys: string[]): Promise<any[]> {
        if (rawKeys.length == 0) return []
        let res: {changes: [key: string, value: string][]}[] = await this.client.call(
            'state_queryStorageAt',
            [rawKeys, blockHash]
        )
        assert(res.length == 1)
        // Response from chain node can't contain key duplicates,
        // but our query list can, hence the following
        // value matching procedure
        let changes = new Map(res[0].changes)
        return rawKeys.map(k => {
            let v = changes.get(k)
            return this.decodeStorageValue(item, v)
        })
    }

    async getKeys(blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any[]> {
        let item = this.getStorageItem(prefix, name)
        let storageHash = sto.getNameHash(prefix) + sto.getNameHash(name).slice(2) + this.getStorageItemKeysHash(item, args)
        let res: string[] = await this.client.call('state_getKeys', [storageHash, blockHash])
        return res.map(k => this.decodeStorageKey(item, k))
    }

    async getRawKeys(blockHash: string, prefix: string, name: string, ...args: any[]): Promise<string[]> {
        let item = this.getStorageItem(prefix, name)
        let storageHash = sto.getNameHash(prefix) + sto.getNameHash(name).slice(2) + this.getStorageItemKeysHash(item, args)
        return await this.client.call('state_getKeys', [storageHash, blockHash])
    }

    async *getKeysPaged(pageSize: number, blockHash: string, prefix: string, name: string, ...args: any[]): AsyncIterable<any[]> {
        assert(pageSize > 0)
        let item = this.getStorageItem(prefix, name)
        let storageHash = sto.getNameHash(prefix) + sto.getNameHash(name).slice(2) + this.getStorageItemKeysHash(item, args)
        let lastKey = null
        while (true) {
            let res: string[] = await this.client.call('state_getKeysPaged', [storageHash, pageSize, lastKey, blockHash])
            if (res.length == 0) return

            yield res.map(k => this.decodeStorageKey(item, k))

            if (res.length == pageSize) {
                lastKey = last(res)
            } else {
                return
            }
        }
    }

    async getPairs(blockHash: string, prefix: string, name: string, ...args: any[]): Promise<[key: any, value: any][]> {
        let item = this.getStorageItem(prefix, name)
        let storageHash = sto.getNameHash(prefix) + sto.getNameHash(name).slice(2) + this.getStorageItemKeysHash(item, args)

        let query: string[] = await this.client.call('state_getKeys', [storageHash, blockHash])
        if (query.length == 0) return []

        let res: {changes: [key: string, value: string][]}[] = await this.client.call(
            'state_queryStorageAt',
            [query, blockHash]
        )
        assert(res.length == 1)
        return res[0].changes.map(v => this.decodeStoragePair(item, v))
    }

    async *getPairsPaged(pageSize: number, blockHash: string, prefix: string, name: string, ...args: any[]): AsyncIterable<[key: any, value: any][]> {
        assert(pageSize > 0)
        let item = this.getStorageItem(prefix, name)
        let storageHash = sto.getNameHash(prefix) + sto.getNameHash(name).slice(2) + this.getStorageItemKeysHash(item, args)
        let lastKey = null
        while (true) {
            let query: string[] = await this.client.call('state_getKeysPaged', [storageHash, pageSize, lastKey, blockHash])
            if (query.length == 0) return

            let res: {changes: [key: string, value: string][]}[] = await this.client.call(
                'state_queryStorageAt',
                [query, blockHash]
            )
            assert(res.length == 1)

            yield res[0].changes.map(v => this.decodeStoragePair(item, v))

            if (query.length == pageSize) {
                lastKey = last(query)
            } else {
                return
            }
        }
    }

    private decodeStoragePair(item: StorageItem, pair: [key: string, value: string]): [key: any, value: any] {
        let decodedKey = this.decodeStorageKey(item, pair[0])
        let decodedValue = this.decodeStorageValue(item, pair[1])
        return [decodedKey, decodedValue]
    }

    private decodeStorageValue(item: StorageItem, value: any): any {
        if (value == null) {
            switch(item.modifier) {
                case 'Optional':
                    return undefined
                case 'Default':
                    value = item.fallback
                    break
                case 'Required':
                    throw new Error(`Required storage item not found`)
                default:
                    throw unexpectedCase(item.modifier)
            }
        }
        return this.scaleCodec.decodeBinary(item.value, value)
    }

    private decodeStorageKey(item: StorageItem, key: string): any {
        let res: any[] = []
        let src = new Src(key)
        src.skip(32)
        for (let i = 0; i < item.keys.length; i++) {
            switch(item.hashers[i]) {
                case 'Identity':
                    break
                case 'Blake2_128Concat':
                    src.skip(16)
                    break
                case 'Twox64Concat':
                    src.skip(8)
                    break
                case 'Blake2_128':
                case 'Twox128':
                case 'Blake2_256':
                case 'Twox256':
                    throw new Error(`Original value of storage item key can't be restored from ${item.hashers[i]} encoding`)
                default:
                    throw unexpectedCase(item.hashers[i])
            }
            res.push(this.scaleCodec.decode(item.keys[i], src))
        }
        src.assertEOF()
        return res.length > 1 ? res : res[0]
    }

    private getStorageItemKeysHash(item: StorageItem, keys: any[]) {
        assert(keys.length <= item.hashers.length)
        let hash = ''
        for (let i = 0; i < keys.length; i++) {
            hash += sto.getKeyHash(
                item.hashers[i],
                this.scaleCodec.encodeToBinary(item.keys[i], keys[i])
            ).slice(2)
        }
        return hash
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
        let hash = this.storageHashCache.get(item)
        if (hash == null) {
            hash = getStorageItemTypeHash(this.description.types, item)
            this.storageHashCache.set(item, hash)
        }
        return hash
    }

    getConstant(pallet: string, name: string): any {
        let palletConstants = this.description.constants[pallet]
        if (palletConstants == null) throw new Error(
            `There are no constants in ${pallet} pallet`
        )
        let def = palletConstants[name]
        if (def == null) throw new Error(
            `Unknown constant: ${pallet}.${name}`
        )
        let value = this.constantValueCache.get(def)
        if (value === undefined) {
            value = this.scaleCodec.decodeBinary(def.type, def.value)
            this.constantValueCache.set(def, value)
        }
        return value
    }

    getConstantTypeHash(pallet: string, name: string): string | undefined {
        let def = this.description.constants[pallet]?.[name]
        if (def == null) return undefined
        return getTypeHash(this.description.types, def.type)
    }
}
