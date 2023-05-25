import assert from 'assert'
import {ethers} from 'ethers'

export interface RawStorageLayout {
    storage: RawStorageItem[]
    types: Record<string, RawStorageType>
}

export interface RawStorageItem {
    label: string
    offset: number
    slot: string
    type: string
}

export interface RawStorageType {
    encoding: string
    label: string
    numberOfBytes: string
    base?: string
    members?: RawStorageItem[]
    key?: string
    value?: string
}

export class StorageItem<K extends any[], V> {
    protected fragment: StorageFragment

    constructor(protected layout: StorageLayout, public readonly label: string) {
        this.fragment = layout.getItem(label)
    }

    encodeKey(...keys: K): string {
        return this.layout.encodeKey(this.fragment, keys)
    }

    decodeValue(val: string): V {
        return this.layout.decodeValue(this.fragment, val)
    }
}

enum TypeEncoding {
    Inplace = 'inplace',
    Mapping = 'mapping',
    DynamicArray = 'dynamic_array',
}

// export type Primitive =
//     | ''
//     | 'address'
//     | 'bool'
//     | 'string'
//     | `${'bytes'}${number | ''}`
//     | `${'u' | ''}${'int'}${8 | 16 | 32 | 64 | 128 | 256}`
//     | `enum ${string}`

export interface TypeInfo {
    numberOfBytes: bigint
    label: string
}

export interface InplaceType extends TypeInfo {
    encoding: TypeEncoding.Inplace
    members?: any[]
    base?: string
}

export interface DynamicArrayType extends TypeInfo {
    encoding: TypeEncoding.DynamicArray
    base: string
}

export interface MappingType extends TypeInfo {
    encoding: TypeEncoding.Mapping
    key: string
    value: string
}

export interface Field {
    name: string
    type: string
}

export type Type = InplaceType | MappingType | DynamicArrayType

export enum SlotKind {
    Index,
    Array,
    DynamicArray,
    Mapping,
}

export interface IndexSlot {
    kind: SlotKind.Index
    index: bigint
    offset: number
    type: string
    lable: string
}

export interface ArraySlot {
    kind: SlotKind.Array
    type: string
    lable: string
}

export interface DynamicArraySlot {
    kind: SlotKind.DynamicArray
    type: string
    lable: string
}

export interface MappingSlot {
    kind: SlotKind.Mapping
    type: string
    lable: string
}

export type Slot = IndexSlot | ArraySlot | DynamicArraySlot | MappingSlot

export interface StorageFragment {
    name: string
    path: Slot[]
}

const typeBytes = new RegExp(/^bytes([0-9]*)$/)
const typeInt = new RegExp(/^(u?int)([0-9]*)$/)
const typeEnum = new RegExp(/^enum (.+)$/)

export class StorageLayout {
    public types: Record<string, Type> = {}
    public fragments: StorageFragment[] = []

    constructor(private json: RawStorageLayout) {
        for (let rawItem of json.storage) {
            this.parseRawItem(rawItem, [])
        }
    }

    getItem(name: string): StorageFragment {
        let item = this.fragments.find((f) => f.name === name)
        assert(item != null, `missing item "${name}"`)
        return item
    }

    encodeKey(fragment: StorageFragment, ...keyList: any[]): string {
        let index = 0n

        let prevSlot: Slot | undefined
        for (let slot of fragment.path) {
            switch (slot.kind) {
                case SlotKind.Index: {
                    index += slot.index

                    break
                }
                case SlotKind.Array: {
                    let itemIndex = keyList.pop()
                    assert(
                        (typeof itemIndex === 'number' && Number.isSafeInteger(itemIndex)) ||
                            typeof itemIndex === 'bigint'
                    )
                    itemIndex = BigInt(itemIndex)
                    assert(itemIndex > -1)

                    assert(prevSlot != null)

                    let itemType = this.types[slot.type]
                    assert(itemType != null)

                    let arrayType = this.types[prevSlot.type]
                    assert(arrayType != null)
                    let arrayLen = arrayType.numberOfBytes / itemType.numberOfBytes
                    assert(itemIndex < arrayLen)

                    index += (itemIndex * itemType.numberOfBytes) / 32n

                    break
                }
                case SlotKind.DynamicArray: {
                    let itemIndex = keyList.pop()
                    assert(
                        (typeof itemIndex === 'number' && Number.isSafeInteger(itemIndex)) ||
                            typeof itemIndex === 'bigint'
                    )
                    itemIndex = BigInt(itemIndex)
                    assert(itemIndex > -1n)

                    let itemType = this.types[slot.type]
                    assert(itemType != null)

                    index = BigInt(ethers.keccak256('0x' + index.toString(16).padStart(32, '0')))
                    index += (itemIndex * itemType.numberOfBytes) / 32n

                    break
                }
                case SlotKind.Mapping: {
                    let itemKey = keyList.pop()
                    assert(itemKey != null)

                    assert(prevSlot != null)

                    let mappingType = this.types[prevSlot.type]
                    assert(mappingType != null && mappingType.encoding === TypeEncoding.Mapping)
                    let keyType = this.types[mappingType.key]
                    assert(keyType != null)

                    let paddedKey = padKey(keyType, itemKey)

                    index = BigInt(ethers.keccak256(uint256toHex(index)))
                    index = BigInt(ethers.keccak256(paddedKey + uint256toHex(index).slice(2)))

                    break
                }
            }

            assert(isUint256(index))
            prevSlot = slot
        }

        return uint256toHex(index)
    }

    decodeValue<T>(fragment: StorageFragment, data: string): T {
        // let type = this.project.types[fragment.slot.type]
        // assert(type !== null)

        // assert(type.kind === TypeKind.Primitive)

        // let bytes = getBytesCopy(data)
        // assert(bytes.length === 32)

        // let coder = this.getCoder(type, fragment.name)
        // return coder.decode(new Reader(bytes, false))

        throw new Error('invalid type')
    }

    formatJson(): string {
        return JSON.stringify(this.json)
    }

    private parseRawItem(item: RawStorageItem, path: Slot[]) {
        path.push({
            kind: SlotKind.Index,
            index: BigInt(item.slot),
            offset: item.offset,
            type: item.type,
            lable: item.label,
        })

        this.parseRawType(item.type, path)
    }

    private parseRawType(typeName: string, path: Slot[]) {
        let type = this.json.types[typeName]
        assert(type != null)

        switch (type.encoding) {
            case 'inplace':
                if (type.members != null) {
                    for (let m of type.members) {
                        this.parseRawItem(m, [...path])
                    }
                } else if (type.base != null) {
                    path.push({
                        kind: SlotKind.Array,
                        type: type.base,
                        lable: 'item',
                    })

                    this.parseRawType(type.base, path)
                } else {
                    assert(isPrimitive(type.label))

                    this.fragments.push({
                        name: createFragmentName(path),
                        path,
                    })
                }

                this.types[typeName] = {
                    encoding: TypeEncoding.Inplace,
                    label: type.label,
                    numberOfBytes: BigInt(type.numberOfBytes),
                    base: type.base,
                }
                break
            case 'mapping':
                assert(type.key != null)
                assert(type.value != null)

                path.push({
                    kind: SlotKind.Mapping,
                    type: type.value,
                    lable: 'item',
                })

                this.parseRawType(type.value, path)

                this.types[typeName] = {
                    encoding: TypeEncoding.Mapping,
                    label: type.label,
                    numberOfBytes: BigInt(type.numberOfBytes),
                    key: type.key,
                    value: type.value,
                }

                let keyType = this.json.types[type.key]
                assert(keyType != null)

                this.types[type.key] = {
                    encoding: TypeEncoding.Inplace,
                    label: keyType.label,
                    numberOfBytes: BigInt(keyType.numberOfBytes),
                }

                break
            case 'dynamic_array':
                assert(type.base != null)

                this.fragments.push({
                    name: createFragmentName(path),
                    path,
                })

                path.push({
                    kind: SlotKind.Array,
                    type: type.base,
                    lable: 'item',
                })

                this.parseRawType(type.base, path)

                this.types[typeName] = {
                    encoding: TypeEncoding.DynamicArray,
                    label: type.label,
                    numberOfBytes: BigInt(type.numberOfBytes),
                    base: type.base,
                }
                break
            case 'bytes':
                return
            default:
                throw new Error('unexpected case')
        }
    }
}

function createFragmentName(slots: Slot[]) {
    return slots.map((s) => s.lable).join('.')
}

function isPrimitive(type: string) {
    return (
        typeInt.test(type) ||
        typeBytes.test(type) ||
        typeEnum.test(type) ||
        type === 'bool' ||
        type === 'address' ||
        type === 'string'
    )
}

function uint256toHex(n: bigint): string {
    return '0x' + n.toString(16).padStart(32, '0')
}

function padKey(keyType: Type, key: any) {
    assert(typeInt.test(keyType.label))

    if (typeInt.test(keyType.label) || typeEnum.test(keyType.label)) {
        assert(typeof key === 'number' || typeof key === 'bigint')
        return uint256toHex(toUint256(key, keyType.numberOfBytes * 8n, keyType.label[0] !== 'u'))
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
            return '0x' + key.toLowerCase().padStart(32, '0')
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
    return typeof value == 'string' && value.length % 2 == 0 && /^0x[a-f\d]*$/i.test(value)
}
