import {Codec as ScaleCodec, JsonCodec, Ti} from '@subsquid/scale-codec'
import * as sts from '@subsquid/scale-type-system'
import {ExternalEnum} from '@subsquid/scale-type-system'
import {assertNotNull, last} from '@subsquid/util-internal'
import assert from 'assert'
import {
    Bytes,
    Constant, decodeMetadata,
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
import {
    CallRecord,
    DecodedCall,
    DecodedEvent,
    EventRecord,
    Extrinsic,
    JsonArgs,
    QualifiedName,
    RpcClient,
    RuntimeVersionId
} from './interfaces'
import * as sto from './storage'
import {parseQualifiedName} from './util'


export class Runtime {
    public readonly specName: string
    public readonly specVersion: number
    public readonly implName: string
    public readonly implVersion: number
    public readonly metadata: Metadata
    public readonly description: RuntimeDescription
    public readonly events: EACRegistry
    public readonly calls: EACRegistry
    public readonly scaleCodec: ScaleCodec
    public readonly jsonCodec: JsonCodec
    private constantValueCache = new Map<QualifiedName, any>()
    private storageFallbackCache = new Map<QualifiedName, any>()

    constructor(
        runtimeVersion: RuntimeVersionId,
        metadata: Bytes | Uint8Array | Metadata,
        typesBundle?: OldTypesBundle | OldSpecsBundle,
        private _rpc?: RpcClient
    ) {
        if (typeof metadata == 'string' || metadata instanceof Uint8Array) {
            metadata = decodeMetadata(metadata)
        }
        this.specName = runtimeVersion.specName
        this.specVersion = runtimeVersion.specVersion
        this.implName = runtimeVersion.implName
        this.implVersion = runtimeVersion.implVersion
        this.metadata = metadata
        this.description = getRuntimeDescription(this.metadata, this.specName, this.specVersion, typesBundle)
        this.events = new EACRegistry(this.description.types, this.description.event)
        this.calls = new EACRegistry(this.description.types, this.description.call)
        this.scaleCodec = new ScaleCodec(this.description.types)
        this.jsonCodec = new JsonCodec(this.description.types)
    }

    get rpc(): RpcClient {
        if (this._rpc == null) throw new Error('RPC client is not available')
        return this._rpc
    }

    hasStorageItem(name: QualifiedName): boolean {
        let qn = parseQualifiedName(name)
        return !!this.description.storage[qn[0]]?.items[qn[1]]
    }

    private _getStorageItem([pallet, name]: [string, string]): StorageItem & {prefix: string}  {
        let desc = this.description.storage[pallet]
        if (desc == null) throw new Error(
            `There are no storage items in pallet ${pallet}`
        )
        let def = desc.items[name]
        if (def == null) throw new Error(
            `Unknown storage item: ${pallet}.${name}`
        )
        return {...def, prefix: desc.prefix}
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
        let encodedKey = sto.encodeKey(this.scaleCodec, item.prefix, qn[1], item, key)
        let value: Bytes | undefined = await this.rpc.call('state_getStorageAt', [encodedKey, blockHash])
        if (value == null) return
        return this._decodeStorageValue(item, value)
    }

    async queryStorage(blockHash: string, name: QualifiedName, keys?: any[]): Promise<any[]> {
        let qn = parseQualifiedName(name)
        let item = this._getStorageItem(qn)

        let query: Bytes[]
        if (keys == null) {
            query = await this.rpc.call('state_getKeys', [sto.encodeName(item.prefix, qn[1]), blockHash])
        } else {
            query = keys.map(key => {
                let ks = item.keys.length > 1 ? key : [key]
                assert(ks.length === item.keys.length)
                return sto.encodeKey(this.scaleCodec, item.prefix, qn[1], item, ks)
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
        let encodedKey = sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, args)
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
        let encodedKey = sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, args)
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
        let encodedKey = sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, args)

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
        let encodedKey = sto.encodeKey(this.scaleCodec, qn[0], qn[1], item, args)
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

    encodeCall(call: DecodedCall): Uint8Array {
        return this.scaleCodec.encodeToBinary(this.description.call, call)
    }

    toCallRecord(call: DecodedCall): CallRecord {
        return this.toRecord(call, this.calls)
    }

    toEventRecord(event: DecodedEvent): EventRecord {
        return this.toRecord(event, this.events)
    }

    private toRecord(item: ExternalEnum, registry: EACRegistry): {name: string, args: unknown} {
        let name = item.__kind + "." + item.value.__kind
        let args: unknown
        let def = registry.get(name)
        if (def.fields[0]?.name == null) {
            args = (item.value as any).value
        } else {
            let {__kind, ...props} = item.value
            args = props
        }
        return {name, args}
    }

    toDecodedCall(call: CallRecord): DecodedCall {
        return this.toDecoded(call, this.calls)
    }

    toDecodedEvent(event: EventRecord): DecodedEvent {
        return this.toDecoded(event, this.events)
    }

    private toDecoded(rec: {name: string, args: unknown}, registry: EACRegistry): ExternalEnum {
        let qn = parseQualifiedName(rec.name)
        let def = registry.get(rec.name)
        if (def.fields[0]?.name == null) {
            return {
                __kind: qn[0],
                value: {
                    __kind: qn[1],
                    value: rec.args
                } as any
            }
        } else {
            return {
                __kind: qn[0],
                value: {
                    __kind: qn[1],
                    ...rec.args as any
                }
            }
        }
    }

    /**
     * @deprecated
     */
    decodeCallRecordArguments(call: CallRecord<JsonArgs>): any {
        return this.decodeJsonCallRecordArguments(call)
    }

    /**
     * @deprecated
     */
    decodeEventRecordArguments(event: EventRecord<JsonArgs>): any {
        return this.decodeJsonEventRecordArguments(event)
    }

    decodeJsonCallRecordArguments(call: CallRecord<JsonArgs>): any {
        let def = this.calls.get(call.name)
        return this.decodeJsonArgs(def, call.args)
    }

    decodeJsonEventRecordArguments(event: EventRecord<JsonArgs>): any {
        let def = this.events.get(event.name)
        return this.decodeJsonArgs(def, event.args)
    }

    private decodeJsonArgs(def: EACDefinition, args: any): any {
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

    hasStorage(name: QualifiedName): boolean {
        let qn = parseQualifiedName(name)
        return !!this.description.storage[qn[0]]?.items[qn[1]]
    }

    checkStorageType(
        name: QualifiedName,
        modifier: StorageItem['modifier'] | StorageItem['modifier'][],
        key: sts.Type[],
        valueTy: sts.Type
    ): boolean {
        let qn = parseQualifiedName(name)
        let def = this.description.storage[qn[0]]?.items[qn[1]]
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
}
