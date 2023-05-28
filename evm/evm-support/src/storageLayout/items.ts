import assert from 'assert'
import {DynamicArrayType, InplaceType, MappingType, StorageLayout, StorageType} from './interfaces'
import {ethers} from 'ethers'
import {def, unexpectedCase} from '@subsquid/util-internal'
import {padKey} from './util'
import {HexSink} from '../codeс/sink'

type StorageItemConstructor<S extends StorageItem<any>> = {
    new (layout: StorageLayout, type: string, slot: bigint, offset: number): S
}

export class StorageItem<V> {
    protected type: StorageType

    constructor(
        protected layout: StorageLayout,
        name: string,
        public readonly slot: bigint,
        public readonly offset: number
    ) {
        this.type = this.layout.types.get(name)
    }

    @def
    get key() {
        let sink = new HexSink()
        sink.u256(this.slot)
        return sink.toHex()
    }

    decodeValue(val: string): V {
        assert(this.type.encoding === 'inplace')
        assert(this.type.base == null)
        assert(this.type.members == null)

        throw new Error('not implemented')
    }
}

export class MappingStorageItem<K, I extends StorageItem<any>> extends StorageItem<unknown> {
    protected type: MappingType

    @def
    private get itemConstructor(): StorageItemConstructor<I> {
        let valueType = this.layout.types.get(this.type.value)
        return getItemConstructor(valueType)
    }

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)

        assert(super.type.encoding === 'mapping')
        this.type = super.type
    }

    item(key: K): I {
        let keyType = this.layout.types.get(this.type.key)

        let paddedKey = padKey(keyType, key)
        let itemSlot = BigInt(ethers.keccak256(paddedKey + this.slot.toString(16)))

        return new this.itemConstructor(this.layout, this.type.value, itemSlot, 0)
    }
}

export class ArrayStorageItem<I extends StorageItem<any>> extends StorageItem<unknown> {
    protected type: InplaceType & {base: string}

    @def
    private get itemConstructor(): StorageItemConstructor<I> {
        let baseType = this.layout.types.get(this.type.base)
        return getItemConstructor(baseType)
    }

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)

        assert(super.type.encoding === 'inplace')
        assert(super.type.base != null)
        this.type = super.type as any
    }

    item(index: number | bigint): I {
        if (typeof index === 'number') {
            assert(Number.isSafeInteger(index))
            index = BigInt(index)
        }
        assert(index > -1n)

        let itemType = this.layout.types.get(this.type.base)
        let arrayLen = this.type.numberOfBytes / itemType.numberOfBytes
        assert(index < arrayLen, 'out of range')

        let itemSlot = this.slot + (index * itemType.numberOfBytes) / 32n

        return new this.itemConstructor(this.layout, this.type.base, itemSlot, 0) // FIXME: calculate offset
    }
}

export class DynamicArrayStorageItem<I extends StorageItem<any>> extends StorageItem<bigint> {
    protected type: DynamicArrayType

    @def
    private get itemConstructor(): StorageItemConstructor<I> {
        let baseType = this.layout.types.get(this.type.base)
        return getItemConstructor(baseType)
    }

    constructor(layout: StorageLayout, name: string, slot: bigint, offset: number) {
        super(layout, name, slot, offset)

        assert(super.type.encoding === 'dynamic_array')
        this.type = super.type
    }

    item(index: number | bigint): I {
        if (typeof index === 'number') {
            assert(Number.isSafeInteger(index))
            index = BigInt(index)
        }
        assert(index > -1n)

        let itemType = this.layout.types.get(this.type.base)
        let itemSlot = BigInt(ethers.keccak256(this.slot.toString())) + (index * itemType.numberOfBytes) / 32n

        return new this.itemConstructor(this.layout, this.type.base, itemSlot, 0) // FIXME: calculate offset
    }
}

export class StructStorageItem<F extends Record<string, StorageItem<any>>> extends StorageItem<unknown> {
    protected type: InplaceType & {members: string}

    @def
    private get fields(): F {
        let members = this.type.members
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

        assert(super.type.encoding === 'inplace')
        assert(super.type.members != null)
        this.type = super.type as any
    }

    field<N extends keyof F>(name: N): F[N] {
        let field = this.fields[name]
        assert(field != null)
        return field
    }
}

export function getItemConstructor(type: StorageType): StorageItemConstructor<any> {
    switch (type.encoding) {
        case 'inplace':
            if (type.members != null && type.base == null) {
                return StructStorageItem
            } else if (type.base != null && type.members == null) {
                return ArrayStorageItem
            } else if (type.base == null && type.members == null) {
                return StorageItem
            } else {
                throw unexpectedCase()
            }
        case 'mapping':
            return MappingStorageItem
        case 'dynamic_array':
            return DynamicArrayStorageItem
        case 'bytes':
            return StorageItem
        default:
            throw unexpectedCase()
    }
}
