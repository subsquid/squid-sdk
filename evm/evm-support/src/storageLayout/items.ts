import assert from 'assert'
import {ethers} from 'ethers'
import {unexpectedCase} from '@subsquid/util-internal'
import {HexSink, Src} from './codec'
import {StorageLayout} from './interface'
import {getItemOffset} from './util'

export type StorageItemConstructor<S extends StorageItem> = {
    new (...args: ConstructorParameters<typeof StorageItem>): S
}

export abstract class StorageItem<V = unknown> {
    private _key: string | undefined

    constructor(
        protected layout: StorageLayout,
        public readonly type: string,
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

    decodeValue(value: string): V {
        return this.layout.decodeValue(this.type, value)
    }
}

export abstract class MappingStorageItem extends StorageItem {
    constructor(layout: StorageLayout, type: string, slot: bigint, offset: number) {
        super(layout, type, slot, offset)
    }

    abstract get(key: any): StorageItem

    protected item<S extends StorageItem>(constructor: StorageItemConstructor<S>, key: any): S {
        let type = this.layout.types.get(this.type)
        assert(type.encoding === 'mapping')

        let paddedKey = this.layout.padKey(type.key, key)
        let itemSlot = BigInt(ethers.keccak256(paddedKey + this.key.slice(2)))

        return new constructor(this.layout, type.value, itemSlot, 0)
    }
}

export abstract class DynamicArrayStorageItem extends StorageItem<bigint> {
    constructor(layout: StorageLayout, type: string, slot: bigint, offset: number) {
        super(layout, type, slot, offset)
    }

    abstract at(index: any): StorageItem

    protected item<S extends StorageItem>(constructor: StorageItemConstructor<S>, index: number): S {
        assert(index > -1)

        let type = this.layout.types.get(this.type)
        assert(type.encoding === 'dynamic_array')

        let itemType = this.layout.types.get(type.base)
        let itemSlot = BigInt(ethers.keccak256(this.key)) + (BigInt(index) * itemType.numberOfBytes) / 32n
        let offset = getItemOffset(index, Number(itemType.numberOfBytes))

        return new constructor(this.layout, type.base, itemSlot, offset)
    }
}

export abstract class BytesStorageItem<V extends string | Uint8Array> extends StorageItem<V | bigint> {
    constructor(layout: StorageLayout, type: string, slot: bigint, offset: number) {
        super(layout, type, slot, offset)
    }

    abstract at(index: number): BytesPartStorageItem<V>

    protected part<S extends BytesPartStorageItem<V>>(constructor: StorageItemConstructor<S>, index: number): S {
        assert(Number.isSafeInteger(index))
        assert(index > -1)

        let type = this.layout.types.get(this.type)
        assert(type.encoding === 'bytes')

        let itemSlot = BigInt(ethers.keccak256(this.key))

        return new constructor(this.layout, this.type, itemSlot, 0)
    }
}

export class BytesPartStorageItem<V extends string | Uint8Array> extends StorageItem<V> {
    constructor(layout: StorageLayout, type: string, slot: bigint, offset: number) {
        super(layout, type, slot, offset)
    }

    decodeValue(val: string): V {
        let src = new Src(val)
        assert(src.length == 32)

        let type = this.layout.types.get(this.type)
        assert(type.encoding === 'bytes')

        switch (type.label) {
            case 'string':
                return src.str(32) as V
            case 'bytes':
                return src.bytes(32) as V
            default:
                throw unexpectedCase(type.label)
        }
    }
}
