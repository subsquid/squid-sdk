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
    StorageItem,
    Type,
    Variant
} from '../metadata'
import {decodeExtrinsic, encodeExtrinsic} from './extrinsic'
import {CallRecord, DecodedCall, EventRecord, Extrinsic, QualifiedName, RpcClient, RuntimeVersionId} from './interfaces'
import * as sto from './storage'
import {createScaleType, parseQualifiedName} from './util'
import {getTypeChecker} from '@subsquid/scale-type-system'


export class Runtime {
    public readonly specName: string
    public readonly specVersion: number
    public readonly implName: string
    public readonly implVersion: number
    public readonly description: RuntimeDescription
    public readonly scaleCodec: ScaleCodec
    public readonly jsonCodec: JsonCodec
    private constantValueCache = new Map<QualifiedName, any>()
    private storageFallbackCache = new Map<QualifiedName, any>()

    constructor(
        runtimeVersion: RuntimeVersionId,
        metadata: Bytes | Metadata,
        typesBundle?: OldTypesBundle | OldSpecsBundle,
        private _rpc?: RpcClient
    ) {
        this.specName = runtimeVersion.specName
        this.specVersion = runtimeVersion.specVersion
        this.implName = runtimeVersion.implName
        this.implVersion = runtimeVersion.implVersion
        this.description = getRuntimeDescription(metadata, this.specName, this.specVersion, typesBundle)
        this.scaleCodec = new ScaleCodec(this.description.types)
        this.jsonCodec = new JsonCodec(this.description.types)
    }

    get rpc(): RpcClient {
        if (this._rpc == null) throw new Error('RPC client is not available')
        return this._rpc
    }

    hasStorageItem(name: QualifiedName): boolean {
        let qn = parseQualifiedName(name)
        return !!this.description.pallets[qn[0]]?.storage[qn[1]]
    }

    private _getStorageItem([pallet, name]: [string, string]): StorageItem  {
        let items = this.description.pallets[pallet]?.storage
        if (items == null) throw new Error(
            `There are no storage items in pallet ${pallet}`
        )
        let def = items[name]
        if (def == null) throw new Error(
            `Unknown storage item: ${pallet}.${name}`
        )
        return def
    }

    encodeStorageKey(name: QualifiedName, ...key: any[]): Bytes {
        let qn = parseQualifiedName(name)
        return sto.encodeKey(
            this.scaleCodec,
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

    getStorageFallback(name: QualifiedName): any {
        let value = this.storageFallbackCache.get(name)
        if (value === undefined) {
            let qn = parseQualifiedName(name)
            let item = this._getStorageItem(qn)
            assert(item.modifier == 'Default')
            value = this._decodeStorageValue(item)
            this.storageFallbackCache.set(name, value)
        }
        return value
    }

    async getStorage(blockHash: string, name: QualifiedName, ...key: any[]): Promise<any> {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        assert(item.keys.length === key.length)
        let encodedKey = sto.encodeKey(this.scaleCodec, item, key)
        let value: Bytes | undefined = await this.rpc.call('state_getStorageAt', [encodedKey, blockHash])
        if (value == null) return
        return this._decodeStorageValue(item, value)
    }

    async queryStorage(blockHash: string, name: QualifiedName, keys?: any[]): Promise<any[]> {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)

        let query: Bytes[]
        if (keys == null) {
            query = await this.rpc.call('state_getKeys', [sto.encodeName(qn[0], qn[1]), blockHash])
        } else {
            query = keys.map(key => {
                let ks = item.keys.length > 1 ? key : [key]
                assert(ks.length === item.keys.length)
                return sto.encodeKey(this.scaleCodec, item, ks)
            })
        }

        if (query.length == 0) return []

        let result: {changes: [key: string, value: string | null][]}[] = await this.rpc.call(
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
            if (v == null) return
            return this._decodeStorageValue(item, v)
        })
    }

    async getStorageKeys(blockHash: string, name: QualifiedName, ...args: any[]): Promise<any[]> {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        let encodedKey = sto.encodeKey(this.scaleCodec, item, args)
        let values: Bytes[] = await this.rpc.call('state_getKeys', [encodedKey, blockHash])
        return values.map(v => this._decodeStorageKey(item, v))
    }

    async getStorageRawKeys(blockHash: string, name: QualifiedName, ...args: any[]): Promise<Bytes[]> {
        let encodedKey = this.encodeStorageKey(name, ...args)
        return this.rpc.call('state_getKeys', [encodedKey, blockHash])
    }

    async *getStorageKeysPaged(pageSize: number, blockHash: string, name: QualifiedName, ...args: any[]): AsyncIterable<any[]> {
        assert(pageSize > 0)
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        let encodedKey = sto.encodeKey(this.scaleCodec, item, args)
        let lastKey = null
        while (true) {
            let keys: Bytes[] = await this.rpc.call('state_getKeysPaged', [encodedKey, pageSize, lastKey, blockHash])
            if (keys.length == 0) return

            yield keys.map(k => this._decodeStorageKey(item, k))

            if (keys.length == pageSize) {
                lastKey = last(keys)
            } else {
                return
            }
        }
    }

    async getStoragePairs(blockHash: string, name: QualifiedName, ...args: any[]): Promise<[key: any, value: any][]> {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        let encodedKey = sto.encodeKey(this.scaleCodec, item, args)

        let query: Bytes[] = await this.rpc.call('state_getKeys', [encodedKey, blockHash])
        if (query.length == 0) return []

        let res: {changes: [key: string, value: string][]}[] = await this.rpc.call(
            'state_queryStorageAt',
            [query, blockHash]
        )
        assert(res.length == 1)
        return res[0].changes.map(kv => this.decodeStoragePair(item, kv))
    }

    async *getStoragePairsPaged(pageSize: number, blockHash: string, name: QualifiedName, ...args: any[]): AsyncIterable<[key: any, value: any][]> {
        assert(pageSize > 0)
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)
        let encodedKey = sto.encodeKey(this.scaleCodec, item, args)
        let lastKey = null
        while (true) {
            let query: Bytes[] = await this.rpc.call('state_getKeysPaged', [encodedKey, pageSize, lastKey, blockHash])
            if (query.length == 0) return

            let res: {changes: [key: string, value: string][]}[] = await this.rpc.call(
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
        return !!this.description.pallets[qn[0]]?.constants[qn[1]]
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
        let palletConstants = this.description.pallets[qn[0]]?.constants
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
        let qn = parseQualifiedName(call.name)
        let calls = this.description.pallets[qn[0]]?.calls
        if (calls == null) throw new Error(
            `There are no calls in ${qn[0]} pallet`
        )
        let def = calls[qn[1]]
        if (def == null) throw new Error(
            `Unknown call: ${call.name}`
        )
        return this.decodeArgs(def, call.args)
    }

    decodeEventRecordArguments(event: EventRecord): any {
        let qn = parseQualifiedName(event.name)
        let events = this.description.pallets[qn[0]]?.events
        if (events == null) throw new Error(
            `There are no events in ${qn[0]} pallet`
        )
        let def = events[qn[1]]
        if (def == null) throw new Error(
            `Unknown call: ${event.name}`
        )
    }

    private decodeArgs(def: Variant, args: any): any {
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
        let qn = parseQualifiedName(name)
        return !!this.description.pallets[qn[0]]?.events[qn[1]]
    }

    hasCall(name: QualifiedName): boolean {
        let qn = parseQualifiedName(name)
        return !!this.description.pallets[qn[0]]?.calls[qn[1]]
    }

    checkType(ti: Ti, ty: sts.Type): boolean {
        return sts.match(this.description.types, ti, ty)
    }

    checkEventType(name: QualifiedName, ty: sts.Type): boolean {
        return this.checkEOCType('events', name, ty)
    }

    checkCallType(name: QualifiedName, ty: sts.Type): boolean {
        return this.checkEOCType('calls', name, ty)
    }

        checkConstantType(name: QualifiedName, ty: sts.Type): boolean {
        let qn = parseQualifiedName(name)
        let def = this.description.pallets[qn[0]]?.constants[qn[1]]
        if (def == null) return false
        return this.checkType(def.type, ty)
    }

    checkStorageType(
        name: QualifiedName,
        modifier: StorageItem['modifier'] | StorageItem['modifier'][],
        key: sts.Type[],
        valueTy: sts.Type
    ): boolean {
        let qn = parseQualifiedName(name)
        let def = this.description.pallets[qn[0]]?.storage[qn[1]]
        if (def == null) return false
        if (Array.isArray(modifier)) {
            if (!modifier.includes(def.modifier)) return false
        } else {
            if (def.modifier != modifier) return false
        }
        if (def.keys.length !== key.length) return false
        for (let i = 0; i < key.length; i++) {
            if (!this.checkType(def.keys[i], key[i])) return false
        }
        return this.checkType(def.value, valueTy)
    }

    private checkEOCType(kind: 'events' | 'calls', name: QualifiedName, ty: sts.Type): boolean {
        let qn = parseQualifiedName(name)
        let def = this.description.pallets[qn[0]]?.[kind][qn[1]]
        if (def == null) return false
        let scaleType = createScaleType(this.description.types, def)
        return ty.match(getTypeChecker(this.description.types), scaleType)
    }
}
