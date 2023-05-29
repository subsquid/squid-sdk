import assert from 'assert'
import {ethers} from 'ethers'
import {unexpectedCase} from '@subsquid/util-internal'
import {BytesType, DynamicArrayType, InplaceType, MappingType, StorageLayout, StorageType} from './interfaces'
import {decodeValue, padKey} from './util'
import {HexSink, Src} from './codec'

export interface StorageItem<V> {
    readonly key: string
    decodeValue(val: string): V
}

abstract class BaseStorageItem<V> implements StorageItem<V> {
    private _key: string | undefined

    constructor(
        protected layout: StorageLayout,
        public readonly name: string,
        public readonly slot: bigint,
        public readonly offset: number
    ) {}

    get key() {
        if (this._key == null) {
            let sink = new HexSink()
            sink.u256(this.slot)
            this._key = sink.toHex()
        }

        return this._key
    }

    abstract decodeValue(val: string): V
}

export class ValueStorageItem<V> extends BaseStorageItem<V> {
    protected type: InplaceType

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)
        let type = this.layout.types.get(name) as Readonly<StorageType>
        assert(type.encoding === 'inplace')
        this.type = type
    }

    decodeValue(val: string): V {
        return decodeValue(this.type, val, this.offset)
    }
}

export class MappingStorageItem<K, I extends BaseStorageItem<any>> extends BaseStorageItem<unknown> {
    protected type: MappingType

    private get itemConstructor(): StorageItemConstructor<I> {
        let valueType = this.layout.types.get(this.type.value)
        return getItemConstructor(valueType)
    }

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)

        let type = this.layout.types.get(name)
        assert(type.encoding === 'mapping')
        this.type = type
    }

    item(key: K): I {
        let keyType = this.layout.types.get(this.type.key)

        let paddedKey = padKey(keyType, key)
        let itemSlot = BigInt(ethers.keccak256(paddedKey + this.key.slice(2)))

        return new this.itemConstructor(this.layout, this.type.value, itemSlot, 0)
    }

    decodeValue(): unknown {
        throw undecodableType(this.name)
    }
}

export class ArrayStorageItem<I extends BaseStorageItem<any>> extends BaseStorageItem<unknown> {
    protected type: InplaceType

    private get itemConstructor(): StorageItemConstructor<I> {
        assert(this.type.base != null)
        let baseType = this.layout.types.get(this.type.base)
        return getItemConstructor(baseType)
    }

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)

        let type = this.layout.types.get(name)
        assert(type.encoding === 'inplace')
        this.type = type
    }

    item(index: number | bigint): I {
        if (typeof index === 'number') {
            assert(Number.isSafeInteger(index))
            index = BigInt(index)
        }
        assert(index > -1n)

        assert(this.type.base != null)
        let itemType = this.layout.types.get(this.type.base)
        let arrayLen = this.type.numberOfBytes / itemType.numberOfBytes
        assert(index < arrayLen, 'out of range')

        let itemSlot = this.slot + (index * itemType.numberOfBytes) / 32n

        let offset = getItemOffset(index, itemType.numberOfBytes)
        return new this.itemConstructor(this.layout, this.type.base, itemSlot, offset)
    }

    decodeValue(): unknown {
        throw undecodableType(this.name)
    }
}

export class DynamicArrayStorageItem<I extends BaseStorageItem<any>> extends BaseStorageItem<bigint> {
    protected type: DynamicArrayType

    private get itemConstructor(): StorageItemConstructor<I> {
        let baseType = this.layout.types.get(this.type.base)
        return getItemConstructor(baseType)
    }

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)

        let type = this.layout.types.get(name)
        assert(type.encoding === 'dynamic_array')
        this.type = type
    }

    item(index: number | bigint): I {
        if (typeof index === 'number') {
            assert(Number.isSafeInteger(index))
            index = BigInt(index)
        }
        assert(index > -1n)

        let itemType = this.layout.types.get(this.type.base)
        let itemSlot = BigInt(ethers.keccak256(this.key)) + (index * itemType.numberOfBytes) / 32n

        let offset = getItemOffset(index, itemType.numberOfBytes)
        return new this.itemConstructor(this.layout, this.type.base, itemSlot, offset)
    }

    decodeValue(val: string): bigint {
        let src = new Src(val)
        assert(src.length == 32)
        return src.u256()
    }
}

export class StructStorageItem<F extends Record<string, BaseStorageItem<any>>> extends BaseStorageItem<unknown> {
    protected type: InplaceType

    private get fields(): F {
        let members = this.type.members
        assert(members != null)
        return Object.fromEntries(
            members.map((m) => {
                let memberType = this.layout.types.get(m.type)
                let memberConstructor = getItemConstructor(memberType)
                return [m.label, new memberConstructor(this.layout, m.type, this.slot + m.slot, m.offset)]
            })
        ) as any // FIXME: figure out how to correctly infer type
    }

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)

        let type = this.layout.types.get(name)
        assert(type.encoding === 'inplace')
        this.type = type as any
    }

    field<N extends keyof F>(name: N): F[N] {
        let field = this.fields[name]
        assert(field != null)
        return field
    }

    decodeValue(): unknown {
        throw undecodableType(this.name)
    }
}

export class BytesStorageItem<V extends string | Uint8Array> extends BaseStorageItem<V | bigint> {
    protected type: BytesType

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)

        let type = this.layout.types.get(name)
        assert(type.encoding === 'bytes')
        this.type = type
    }

    part(index: number | bigint): BytesPartStorageItem<V> {
        if (typeof index === 'number') {
            assert(Number.isSafeInteger(index))
            index = BigInt(index)
        }
        assert(index > -1n)

        let itemSlot = BigInt(ethers.keccak256(this.key))

        return new BytesPartStorageItem(this.layout, this.name, itemSlot, 0)
    }

    decodeValue(val: string): V {
        return decodeValue(this.type, val, this.offset)
    }
}

export class BytesPartStorageItem<V extends string | Uint8Array> extends BaseStorageItem<V> {
    protected type: BytesType

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)

        let type = this.layout.types.get(name)
        assert(type.encoding === 'bytes')
        this.type = type
    }

    decodeValue(val: string): V {
        let src = new Src(val)
        assert(src.length == 32)

        switch (this.type.label) {
            case 'string':
                return src.str(32) as V
            case 'bytes':
                return src.bytes(32) as V
            default:
                throw unexpectedCase(this.type.label)
        }
    }
}

function getItemOffset(index: bigint, width: bigint) {
    return Number((index % (32n / width)) * width)
}

export function getItemConstructor(type: StorageType): StorageItemConstructor<any> {
    switch (type.encoding) {
        case 'inplace':
            if (type.members != null && type.base == null) {
                return StructStorageItem
            } else if (type.base != null && type.members == null) {
                return ArrayStorageItem
            } else if (type.base == null && type.members == null) {
                return ValueStorageItem
            } else {
                throw unexpectedCase()
            }
        case 'mapping':
            return MappingStorageItem
        case 'dynamic_array':
            return DynamicArrayStorageItem
        case 'bytes':
            return BytesStorageItem
        default:
            throw unexpectedCase()
    }
}

export type StorageItemConstructor<I extends BaseStorageItem<any>> = {
    new (...args: ConstructorParameters<typeof BaseStorageItem>): I
}

function undecodableType(type: string) {
    new Error(`Undecodable type: ${type}`)
}
