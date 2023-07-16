import {Codec as ScaleCodec, JsonCodec} from '@subsquid/scale-codec'
import {
    ChainDescription,
    Constant,
    decodeExtrinsic,
    Field,
    getChainDescription,
    getTypeHash,
    OldSpecsBundle,
    OldTypesBundle,
    QualifiedName,
    StorageItem
} from '@subsquid/substrate-metadata'
import * as eac from '@subsquid/substrate-metadata/lib/events-and-calls'
import {getStorageItemTypeHash} from '@subsquid/substrate-metadata/lib/storage'
import {Bytes, RuntimeVersionId} from '@subsquid/substrate-data-raw'
import {assertNotNull, last} from '@subsquid/util-internal'
import assert from 'assert'
import * as decoded from './interfaces/data-decoded'
import * as sto from './runtime-storage'


export class Runtime {
    public readonly specName: string
    public readonly specVersion: number
    public readonly implName: string
    public readonly implVersion: number
    public readonly description: ChainDescription
    public readonly events: eac.Registry
    public readonly calls: eac.Registry
    public readonly scaleCodec: ScaleCodec
    public readonly jsonCodec: JsonCodec
    private constantValueCache = new Map<Constant, any>()
    private storageHashCache = new Map<StorageItem, string>()

    constructor(
        runtimeVersion: RuntimeVersionId,
        metadata: Bytes,
        typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
        this.specName = runtimeVersion.specName
        this.specVersion = runtimeVersion.specVersion
        this.implName = runtimeVersion.implName
        this.implVersion = runtimeVersion.implVersion
        this.description = getChainDescription(metadata, this.specName, this.specVersion, typesBundle)
        this.events = new eac.Registry(this.description.types, this.description.event)
        this.calls = new eac.Registry(this.description.types, this.description.call)
        this.scaleCodec = new ScaleCodec(this.description.types)
        this.jsonCodec = new JsonCodec(this.description.types)
    }

    hasStorageItem(prefix: string, name: string): boolean {
        return !!this.description.storage[prefix]?.[name]
    }

    getStorageItem(name: QualifiedName): StorageItem
    getStorageItem(prefix: string, name: string): StorageItem
    getStorageItem(prefixOrQualifiedName: string, name?: string): StorageItem {
        let prefix: string
        if (name == null) {
            let [p, n] = splitQualifiedName(prefixOrQualifiedName)
            prefix = p
            name = n
        } else {
            prefix = prefixOrQualifiedName
        }
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
        let def = this.description.storage[prefix]?.[name]
        if (def == null) return undefined
        let hash = this.storageHashCache.get(def)
        if (hash == null) {
            hash = getStorageItemTypeHash(this.description.types, def)
            this.storageHashCache.set(def, hash)
        }
        return hash
    }

    encodeStorageKey(prefix: string, name: string, ...key: any[]): Bytes {
        return sto.encodeKey(
            this.scaleCodec,
            prefix,
            name,
            this.getStorageItem(prefix, name),
            key
        )
    }

    decodeStorageKey(item: StorageItem | QualifiedName, key: Bytes): any {
        if (typeof item == 'string') {
            item = this.getStorageItem(item)
        }
        let decoded = sto.decodeKey(this.scaleCodec, item, key)
        return decoded.length > 1 ? decoded : decoded[0]
    }

    decodeStorageValue(item: StorageItem | QualifiedName, value?: Bytes | Uint8Array): any {
        if (typeof item == 'string') {
            item = this.getStorageItem(item)
        }
        return sto.decodeValue(this.scaleCodec, item, value)
    }

    async getStorage(rpc: RpcClient, blockHash: string, prefix: string, name: string, ...key: any[]): Promise<any> {
        let item = this.getStorageItem(prefix, name)
        assert(item.keys.length === key.length)
        let encodedKey = sto.encodeKey(this.scaleCodec, prefix, name, item, key)
        let value: Bytes | undefined = await rpc.call('state_getStorageAt', [encodedKey, blockHash])
        return this.decodeStorageValue(item, value)
    }

    async queryStorage(rpc: RpcClient, blockHash: string, prefix: string, name: string, keys?: any[]): Promise<any[]> {
        let item = this.getStorageItem(prefix, name)

        let query: Bytes[]
        if (keys == null) {
            query = await rpc.call('state_getKeys', [sto.encodeName(prefix, name), blockHash])
        } else {
            query = keys.map(key => {
                let ks = item.keys.length > 1 ? key : [key]
                assert(ks.length === item.keys.length)
                return sto.encodeKey(this.scaleCodec, prefix, name, item, ks)
            })
        }

        if (query.length == 0) return []

        let result: {changes: [key: string, value: string][]}[] = await rpc.call(
            'state_queryStorageAt',
            [query, blockHash]
        )

        assert(result.length == 1)

        // Response from chain node can't contain key duplicates,
        // but our query list can, hence the following
        // value matching procedure
        let changes = new Map(result[0].changes)
        return query.map(k => {
            let v = changes.get(k)
            return this.decodeStorageValue(item, v)
        })
    }

    async getKeys(rpc: RpcClient, blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any[]> {
        let item = this.getStorageItem(prefix, name)
        let encodedKey = sto.encodeKey(this.scaleCodec, prefix, name, item, args)
        let values: Bytes[] = await rpc.call('state_getKeys', [encodedKey, blockHash])
        return values.map(v => this.decodeStorageKey(item, v))
    }

    async getRawKeys(rpc: RpcClient, blockHash: string, prefix: string, name: string, ...args: any[]): Promise<Bytes[]> {
        let encodedKey = this.encodeStorageKey(prefix, name, ...args)
        return rpc.call('state_getKeys', [encodedKey, blockHash])
    }

    async *getKeysPaged(rpc: RpcClient, pageSize: number, blockHash: string, prefix: string, name: string, ...args: any[]): AsyncIterable<any[]> {
        assert(pageSize > 0)
        let item = this.getStorageItem(prefix, name)
        let encodedKey = sto.encodeKey(this.scaleCodec, prefix, name, item, args)
        let lastKey = null
        while (true) {
            let keys: Bytes[] = await rpc.call('state_getKeysPaged', [encodedKey, pageSize, lastKey, blockHash])
            if (keys.length == 0) return

            yield keys.map(k => this.decodeStorageKey(item, k))

            if (keys.length == pageSize) {
                lastKey = last(keys)
            } else {
                return
            }
        }
    }

    async getPairs(rpc: RpcClient, blockHash: string, prefix: string, name: string, ...args: any[]): Promise<[key: any, value: any][]> {
        let item = this.getStorageItem(prefix, name)
        let encodedKey = sto.encodeKey(this.scaleCodec, prefix, name, item, args)

        let query: Bytes[] = await rpc.call('state_getKeys', [encodedKey, blockHash])
        if (query.length == 0) return []

        let res: {changes: [key: string, value: string][]}[] = await rpc.call(
            'state_queryStorageAt',
            [query, blockHash]
        )
        assert(res.length == 1)
        return res[0].changes.map(kv => this.decodeStoragePair(item, kv))
    }

    async *getPairsPaged(rpc: RpcClient, pageSize: number, blockHash: string, prefix: string, name: string, ...args: any[]): AsyncIterable<[key: any, value: any][]> {
        assert(pageSize > 0)
        let item = this.getStorageItem(prefix, name)
        let encodedKey = sto.encodeKey(this.scaleCodec, prefix, name, item, args)
        let lastKey = null
        while (true) {
            let query: Bytes[] = await rpc.call('state_getKeysPaged', [encodedKey, pageSize, lastKey, blockHash])
            if (query.length == 0) return

            let res: {changes: [key: string, value: string][]}[] = await rpc.call(
                'state_queryStorageAt',
                [query, blockHash]
            )
            assert(res.length == 1)

            yield res[0].changes.map(kv => this.decodeStoragePair(item, kv))

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

    hasConstant(pallet: string, name: string): boolean {
        return !!this.description.constants[pallet]?.[name]
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

    getConstantTypeHash(pallet: string, name: string): Bytes | undefined {
        let def = this.description.constants[pallet]?.[name]
        if (def == null) return undefined
        return getTypeHash(this.description.types, def.type)
    }

    decodeExtrinsic(bytes: Bytes | Uint8Array): decoded.Extrinsic {
        return decodeExtrinsic(bytes, this.description, this.scaleCodec)
    }

    decodeCall(bytes: Bytes | Uint8Array): decoded.Call {
        return this.scaleCodec.decodeBinary(this.description.call, bytes)
    }

    decodeJsonCall(call: {name: QualifiedName, args: any}): any {
        let def = this.calls.get(call.name)
        return this.decodeArgs(def, call.args)
    }

    decodeJsonEvent(call: {name: QualifiedName, args: any}): any {
        let def = this.events.get(call.name)
        return this.decodeArgs(def, call.args)
    }

    private decodeArgs(def: eac.Definition, args: any): any {
        if (def.fields.length == 0) return undefined
        if (def.fields[0].name == null) return this.decodeJsonTuple(def.fields, args)
        assert(args != null && typeof args == 'object', 'invalid args')
        let result: any = {}
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i]
            let name = assertNotNull(f.name)
            result[name] = this.jsonCodec.decode(f.type, args[name])
        }
        return result
    }

    private decodeJsonTuple(fields: Field[], args: unknown): any {
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

    hasEvent(name: QualifiedName): boolean {
        return !!this.events.definitions[name]
    }

    getEventTypeHash(name: QualifiedName): string {
        return this.events.getHash(name)
    }

    getCallTypeHash(name: QualifiedName): string {
        return this.calls.getHash(name)
    }
}


function splitQualifiedName(name: QualifiedName): [prefix: string, name: string] {
    let split = name.split('.')
    assert(split.length == 2)
    return split as [string, string]
}


interface RpcClient {
    call(method: string, params?: any[]): Promise<any>
}
