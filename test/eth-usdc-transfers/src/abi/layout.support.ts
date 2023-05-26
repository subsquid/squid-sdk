import assert from 'assert'
import {ethers} from 'ethers'

type StorageItemConstructor<S extends StorageItem<any>> = {
    new (layout: StorageLayout, type: StorageType, slot: string, offset: number): S
}

export interface StorageLayout {
    storage: StorageFragment[]
    types: Record<string, StorageType>
}

export interface StorageFragment {
    label: string
    offset: number
    slot: string
    type: string
}

export interface StorageType {
    encoding: string
    label: string
    numberOfBytes: string
    base?: string
    members?: StorageFragment[]
    key?: string
    value?: string
}

export class StorageItem<V> {
    constructor(
        protected layout: StorageLayout,
        protected type: StorageType,
        public readonly slot: string,
        public readonly offset: number
    ) {}

    decodeValue(val: string): V {
        throw new Error('not implemented')
    }
}

export class StructStorageItem<F extends Record<string, StorageItem<any>>> extends StorageItem<unknown> {
    private fields: F

    constructor(layout: StorageLayout, type: StorageType, slot: string, offset: number) {
        super(layout, type, slot, offset)

        let members = this.getMembers()
        this.fields = Object.fromEntries(
            members.map((m: StorageFragment & {label: keyof F}) => {
                let memberType = this.layout.types[m.type]
                assert(memberType != null)
                let memberConstructor = getItemConstructor(memberType)
                return [
                    m.label,
                    new memberConstructor(
                        layout,
                        memberType,
                        uint256toHex(BigInt(this.slot) + BigInt(m.slot)),
                        m.offset
                    ),
                ]
            })
        ) as any
    }

    item<N extends keyof F>(field: N): F[N] {
        return this.fields[field]
    }

    private getMembers() {
        assert(this.type.members != null)
        return this.type.members
    }
}

export class MappingStorageItem<K, I extends StorageItem<any>> extends StorageItem<unknown> {
    private itemContructor: StorageItemConstructor<I>

    constructor(layout: StorageLayout, type: StorageType, slot: string, offset: number) {
        super(layout, type, slot, offset)

        let valueType = this.getValueType()
        this.itemContructor = getItemConstructor(valueType)
    }

    item(key: K): I {
        let keyType = this.getKeyType()
        let paddedKey = padKey(keyType, key)

        let itemType = this.getValueType()
        let itemSlot = ethers.keccak256(paddedKey + this.slot.slice(2))

        return new this.itemContructor(this.layout, itemType, itemSlot, 0)
    }

    private getKeyType() {
        assert(this.type.key != null)

        let type = this.layout.types[this.type.key]
        assert(type != null)

        return type
    }

    private getValueType() {
        assert(this.type.value != null)

        let type = this.layout.types[this.type.value]
        assert(type != null)

        return type
    }
}

export class ArrayStorageItem<I extends StorageItem<any>> extends StorageItem<unknown> {
    private itemContructor: StorageItemConstructor<I>

    constructor(layout: StorageLayout, type: StorageType, slot: string, offset: number) {
        super(layout, type, slot, offset)

        let baseType = this.getBaseType()
        this.itemContructor = getItemConstructor(baseType)
    }

    item(index: number | bigint): I {
        if (typeof index === 'number') {
            assert(Number.isSafeInteger(index))
            index = BigInt(index)
        }
        assert(index > -1n)

        let itemType = this.getBaseType()
        let arrayLen = BigInt(this.type.numberOfBytes) / BigInt(itemType.numberOfBytes)
        assert(index < arrayLen)
        let itemSlot = uint256toHex(BigInt(this.slot) + (index * BigInt(itemType.numberOfBytes)) / 32n)

        return new this.itemContructor(this.layout, itemType, itemSlot, 0)
    }

    private getBaseType() {
        assert(this.type.base != null)

        let baseType = this.layout.types[this.type.base]
        assert(baseType != null)

        return baseType
    }
}

export class DynamicArrayStorageItem<I extends StorageItem<any>> extends StorageItem<bigint> {
    private itemContructor: StorageItemConstructor<I>

    constructor(layout: StorageLayout, type: StorageType, slot: string, offset: number) {
        super(layout, type, slot, offset)

        let baseType = this.getBaseType()
        this.itemContructor = getItemConstructor(baseType)
    }

    item(index: number | bigint): I {
        if (typeof index === 'number') {
            assert(Number.isSafeInteger(index))
            index = BigInt(index)
        }
        assert(index > -1n)

        let itemType = this.getBaseType()
        let itemSlot = uint256toHex(
            BigInt(ethers.keccak256(this.slot)) + (index * BigInt(itemType.numberOfBytes)) / 32n
        )

        return new this.itemContructor(this.layout, itemType, itemSlot, 0)
    }

    private getBaseType() {
        assert(this.type.base != null)

        let baseType = this.layout.types[this.type.base]
        assert(baseType != null)

        return baseType
    }
}

export function getItemConstructor<T extends StorageItem<any>>(type: StorageType): StorageItemConstructor<T> {
    switch (type.encoding) {
        case 'inplace':
            if (type.members != null) {
                return StructStorageItem as any
            } else if (type.base != null) {
                return ArrayStorageItem as any
            } else {
                return StorageItem as any
            }
        case 'mapping':
            return MappingStorageItem as any
        case 'dynamic_array':
            return DynamicArrayStorageItem as any
        case 'bytes':
            return StorageItem as any
        default:
            throw new Error('unexpected case')
    }
}

const typeBytes = new RegExp(/^bytes([0-9]*)$/)
const typeInt = new RegExp(/^(u?int)([0-9]*)$/)
const typeEnum = new RegExp(/^enum (.+)$/)

// export function isPrimitive(type: string) {
//     return (
//         typeInt.test(type) ||
//         typeBytes.test(type) ||
//         typeEnum.test(type) ||
//         type === 'bool' ||
//         type === 'address' ||
//         type === 'string'
//     )
// }

export function uint256toHex(n: bigint): string {
    assert(isUint256(n))
    return '0x' + n.toString(16).padStart(64, '0')
}

function padKey(keyType: StorageType, key: any) {
    if (typeInt.test(keyType.label) || typeEnum.test(keyType.label)) {
        assert(typeof key === 'number' || typeof key === 'bigint')
        return uint256toHex(toUint256(key, BigInt(keyType.numberOfBytes) * 8n, keyType.label[0] !== 'u'))
    }

    if (typeBytes.test(keyType.label)) {
        assert(isHex(key))
        return key
    }

    switch (keyType.label) {
        case 'string':
            return key
        case 'address':
            assert(isHex(key))
            return '0x' + key.toLowerCase().slice(2).padStart(64, '0')
        case 'bool':
            assert(typeof key === 'boolean')
            return uint256toHex(toUint256(BigInt(key), 1n, false))
    }
}

function toUint256(n: number | bigint, width: bigint, signed: boolean): bigint {
    if (typeof n === 'number') {
        assert(Number.isSafeInteger(n))
    }

    n = BigInt(n)

    let base = 2n ** width
    if (signed) {
        let min = -(2n ** (width - 1n))
        let max = 2n ** (width - 1n) - 1n
        assert(n >= min && n <= max)
        n = (n + base) % base
    }

    assert(n < base)
    assert(isUint256(n))

    return n
}

function isUint256(value: unknown) {
    return (
        typeof value == 'bigint' &&
        value >= 0 &&
        value <= 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
    )
}

export function isHex(value: unknown): value is string {
    return typeof value == 'string' && value.length % 2 == 0 && /^0x[A-Fa-f0-9]*$/i.test(value)
}
