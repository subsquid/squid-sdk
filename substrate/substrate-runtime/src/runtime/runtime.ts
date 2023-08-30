import {Codec as ScaleCodec, JsonCodec, Ti, TypeKind} from '@subsquid/scale-codec'
import * as sts from '@subsquid/scale-type-system'
import {assertNotNull, last} from '@subsquid/util-internal'
import assert from 'assert'
import {
    Bytes,
    Constant,
    Field,
    getRuntimeDescription,
    Metadata,
    OldSpecsBundle,
    OldTypesBundle,
    RuntimeDescription,
    StorageItem
} from '../metadata'
import {EACDefinition, EACRegistry} from './events-and-calls'
import {decodeExtrinsic, encodeExtrinsic} from './extrinsic'
import {CallRecord, DecodedCall, EventRecord, Extrinsic, QualifiedName, RpcClient, RuntimeVersionId} from './interfaces'
import * as sto from './storage'
import {parseQualifiedName} from './util'


export class Runtime {
    public readonly specName: string
    public readonly specVersion: number
    public readonly implName: string
    public readonly implVersion: number
    public readonly description: RuntimeDescription
    public readonly events: EACRegistry
    public readonly calls: EACRegistry
    public readonly scaleCodec: ScaleCodec
    public readonly jsonCodec: JsonCodec
    private constantValueCache = new Map<QualifiedName, any>()

    constructor(
        runtimeVersion: RuntimeVersionId,
        metadata: Bytes | Metadata,
        typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
        this.specName = runtimeVersion.specName
        this.specVersion = runtimeVersion.specVersion
        this.implName = runtimeVersion.implName
        this.implVersion = runtimeVersion.implVersion
        this.description = getRuntimeDescription(metadata, this.specName, this.specVersion, typesBundle)
        this.events = new EACRegistry(this.description.types, this.description.event)
        this.calls = new EACRegistry(this.description.types, this.description.call)
        this.scaleCodec = new ScaleCodec(this.description.types)
        this.jsonCodec = new JsonCodec(this.description.types)
    }

    hasStorageItem(name: QualifiedName): boolean {
        let qn = parseQualifiedName(name)
        return !!this.description.storage[qn[0]]?.[qn[1]]
    }

    private _getStorageItem([prefix, name]: [string, string]): StorageItem  {
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

    encodeStorageKey(name: QualifiedName, ...key: any[]): Bytes {
        let qn = parseQualifiedName(name)
        return sto.encodeKey(
            this.scaleCodec,
            qn[0],
            qn[1],
            this._getStorageItem(qn),
            key
        )
    }

    private _decodeStorageKey(item: StorageItem, key: Bytes): any {
        let decoded = sto.decodeKey(this.scaleCodec, item, key)
        return decoded.length > 1 ? decoded : decoded[0]
    }

    private _decodeStorageValue(item: StorageItem, value?: Bytes | Uint8Array | null): any {
        return sto.decodeValue(this.scaleCodec, item, value)
    }

    decodeStorageValue(name: QualifiedName, value?: Bytes | Uint8Array | null): any {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        return this._decodeStorageValue(item, value)
    }

    async getStorage(rpc: RpcClient, blockHash: string, name: QualifiedName, ...key: any[]): Promise<any> {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        assert(item.keys.length === key.length)
        let encodedKey = sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, key)
        let value: Bytes | undefined = await rpc.call('state_getStorageAt', [encodedKey, blockHash])
        return this._decodeStorageValue(item, value)
    }

    async queryStorage(rpc: RpcClient, blockHash: string, name: QualifiedName, keys?: any[]): Promise<any[]> {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)

        let query: Bytes[]
        if (keys == null) {
            query = await rpc.call('state_getKeys', [sto.encodeName(qn[0], qn[1]), blockHash])
        } else {
            query = keys.map(key => {
                let ks = item.keys.length > 1 ? key : [key]
                assert(ks.length === item.keys.length)
                return sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, ks)
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
            return this._decodeStorageValue(item, v)
        })
    }

    async getKeys(rpc: RpcClient, blockHash: string, name: QualifiedName, ...args: any[]): Promise<any[]> {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        let encodedKey = sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, args)
        let values: Bytes[] = await rpc.call('state_getKeys', [encodedKey, blockHash])
        return values.map(v => this._decodeStorageKey(item, v))
    }

    async getRawKeys(rpc: RpcClient, blockHash: string, name: QualifiedName, ...args: any[]): Promise<Bytes[]> {
        let encodedKey = this.encodeStorageKey(name, ...args)
        return rpc.call('state_getKeys', [encodedKey, blockHash])
    }

    async *getKeysPaged(rpc: RpcClient, pageSize: number, blockHash: string, name: QualifiedName, ...args: any[]): AsyncIterable<any[]> {
        assert(pageSize > 0)
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        let encodedKey = sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, args)
        let lastKey = null
        while (true) {
            let keys: Bytes[] = await rpc.call('state_getKeysPaged', [encodedKey, pageSize, lastKey, blockHash])
            if (keys.length == 0) return

            yield keys.map(k => this._decodeStorageKey(item, k))

            if (keys.length == pageSize) {
                lastKey = last(keys)
            } else {
                return
            }
        }
    }

    async getPairs(rpc: RpcClient, blockHash: string, name: QualifiedName, ...args: any[]): Promise<[key: any, value: any][]> {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        let encodedKey = sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, args)

        let query: Bytes[] = await rpc.call('state_getKeys', [encodedKey, blockHash])
        if (query.length == 0) return []

        let res: {changes: [key: string, value: string][]}[] = await rpc.call(
            'state_queryStorageAt',
            [query, blockHash]
        )
        assert(res.length == 1)
        return res[0].changes.map(kv => this.decodeStoragePair(item, kv))
    }

    async *getPairsPaged(rpc: RpcClient, pageSize: number, blockHash: string, name: QualifiedName, ...args: any[]): AsyncIterable<[key: any, value: any][]> {
        assert(pageSize > 0)
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        let encodedKey = sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, args)
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
        let decodedKey = this._decodeStorageKey(item, pair[0])
        let decodedValue = this._decodeStorageValue(item, pair[1])
        return [decodedKey, decodedValue]
    }

    hasConstant(name: QualifiedName): boolean {
        let qn = parseQualifiedName(name)
        return !!this.description.constants[qn[0]]?.[qn[1]]
    }

    getConstant(name: QualifiedName): any {
        let value = this.constantValueCache.get(name)
        if (value === undefined && !this.constantValueCache.has(name)) {
            let def = this.getConstantDefinition(name)
            value = this.scaleCodec.decodeBinary(def.type, def.value)
            this.constantValueCache.set(name, value)
        }
        return value
    }

    private getConstantDefinition(name: QualifiedName): Constant {
        let qn = parseQualifiedName(name)
        let palletConstants = this.description.constants[qn[0]]
        if (palletConstants == null) throw new Error(
            `There are no constants in ${qn[0]} pallet`
        )
        let def = palletConstants[qn[1]]
        if (def == null) throw new Error(
            `Unknown constant: ${name}`
        )
        return def
    }

    decodeExtrinsic(bytes: Bytes | Uint8Array): Extrinsic {
        return decodeExtrinsic(bytes, this.description, this.scaleCodec)
    }

    encodeExtrinsic(extrinsic: Extrinsic): Uint8Array {
        return encodeExtrinsic(extrinsic, this.description, this.scaleCodec)
    }

    decodeCall(bytes: Bytes | Uint8Array): DecodedCall {
        return this.scaleCodec.decodeBinary(this.description.call, bytes)
    }

    decodeCallRecordArguments(call: CallRecord): any {
        let def = this.calls.get(call.name)
        return this.decodeArgs(def, call.args)
    }

    decodeEventRecordArguments(call: EventRecord): any {
        let def = this.events.get(call.name)
        return this.decodeArgs(def, call.args)
    }

    private decodeArgs(def: EACDefinition, args: any): any {
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
        return this.events.has(name)
    }

    hasCall(name: QualifiedName): boolean {
        return this.calls.has(name)
    }

    checkEventType(name: QualifiedName, ty: sts.Type): boolean {
        return this.events.checkType(name, ty)
    }

    checkCallType(name: QualifiedName, ty: sts.Type): boolean {
        return this.calls.checkType(name, ty)
    }

    checkType(ti: Ti, ty: sts.Type): boolean {
        return sts.match(this.description.types, ti, ty)
    }

    checkConstantType(name: QualifiedName, ty: sts.Type): boolean {
        let qn = parseQualifiedName(name)
        let def = this.description.constants[qn[0]]?.[qn[1]]
        if (def == null) return false
        return this.checkType(def.type, ty)
    }

    checkStorageType(name: QualifiedName, optional: boolean, key: sts.Type[], valueTy: sts.Type): boolean {
        let qn = parseQualifiedName(name)
        let def = this.description.storage[qn[0]]?.[qn[1]]
        if (def == null) return false
        if (!optional && def.modifier == 'Optional') return false
        if (def.keys.length !== key.length) return false
        for (let i = 0; i < key.length; i++) {
            if (!this.checkType(def.keys[i], key[i])) return false
        }
        return this.checkType(def.value, valueTy)
    }
}
