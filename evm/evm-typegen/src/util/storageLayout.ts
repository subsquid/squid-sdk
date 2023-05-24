import assert from 'assert'
import {getBytesCopy, keccak256, zeroPadValue} from 'ethers'
// import {Reader} from 'ethers/abi'
// import {AddressCoder} from 'ethers/abi/coders/address'
// import {BooleanCoder} from 'ethers/abi/coders/boolean'
// import {BytesCoder} from 'ethers/abi/coders/bytes'
// import {FixedBytesCoder} from 'ethers/abi/coders/fixed-bytes'
// import {NullCoder} from 'ethers/abi/coders/null'
// import {NumberCoder} from 'ethers/abi/coders/number'
// import {StringCoder} from 'ethers/abi/coders/string'

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
    encoding: 'inplace' | 'bytes' | 'dynamic_array' | 'mapping'
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
        throw new Error('not implemented')
    }
}

enum TypeKind {
    Primitive,
    Array,
    DynamicArray,
    Mapping,
    Struct,
}

export type Primitive =
    | ''
    | 'address'
    | 'bool'
    | 'string'
    | `${'bytes'}${number | ''}`
    | `${'u' | ''}${'int'}${8 | 16 | 32 | 64 | 128 | 256}`
    | `enum ${string}`

export interface TypeInfo {
    numberOfBytes: bigint
    label: string
}

export interface PrimitiveType extends TypeInfo {
    kind: TypeKind.Primitive
    primitive: Primitive
}

export interface ArrayType extends TypeInfo {
    kind: TypeKind.Array
    type: string
}

export interface DynamicArrayType extends TypeInfo {
    kind: TypeKind.DynamicArray
    type: string
}

export interface MappingType extends TypeInfo {
    kind: TypeKind.Mapping
    key: string
    value: string
}

export interface StructType extends TypeInfo {
    kind: TypeKind.Struct
    members: Field[]
}

export interface Field {
    name: string
    type: string
}

export type Type = PrimitiveType | ArrayType | DynamicArrayType | MappingType | StructType

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
    parent?: Slot
}

export interface ArraySlot {
    kind: SlotKind.Array
    type: string
    lable: string
    parent?: Slot
}

export interface DynamicArraySlot {
    kind: SlotKind.DynamicArray
    type: string
    lable: string
    parent?: Slot
}

export interface MappingSlot {
    kind: SlotKind.Mapping
    type: string
    lable: string
    parent?: Slot
}

export type Slot = IndexSlot | ArraySlot | DynamicArraySlot | MappingSlot

export interface StorageFragment {
    name: string
    slot: Slot
}

const typeBytes = new RegExp(/^bytes([0-9]*)$/)
const typeNumber = new RegExp(/^(u?int)([0-9]*)$/)
const typeEnum = new RegExp(/^enum (.+)$/)

export class StorageLayout {
    public project: LayoutProject

    constructor(private json: RawStorageLayout) {
        this.project = new LayoutProject(json)
        console.dir(this.project.fragments, {depth: 5})
    }

    getItem(name: string): StorageFragment {
        let item = this.project.fragments.find((f) => f.name === name)
        assert(item != null, `missing item "${name}"`)
        return item
    }

    encodeKey(fragment: StorageFragment, ...keyList: any[]): string {
        const key = keccak256(zeroPadValue(fragment.slot.toString(), 32))

        // let f = fragment.parent
        // for (let i = keyList.length; i >= 0 && f != null; i--) {}

        return key
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

    private getCoder(type: PrimitiveType, label: string) {
        // switch (type.primitive) {
        //     case 'address':
        //         return new AddressCoder(label)
        //     case 'bool':
        //         return new BooleanCoder(label)
        //     case 'string':
        //         return new StringCoder(label)
        //     case 'bytes':
        //         return new BytesCoder(label)
        //     case '':
        //         return new NullCoder(label)
        // }

        // // u?int[0-9]*
        // let match = type.primitive.match(typeNumber)
        // if (match) {
        //     let size = parseInt(match[2] || '256')
        //     assert(size !== 0 && size <= 256 && size % 8 === 0, `invalid ${match[1]} bit length`)
        //     return new NumberCoder(size / 8, match[1] === 'int', label)
        // }

        // // bytes[0-9]+
        // match = type.primitive.match(typeBytes)
        // if (match) {
        //     let size = parseInt(match[1])
        //     assert(size !== 0 && size <= 32, 'invalid bytes length')
        //     return new FixedBytesCoder(size, label)
        // }

        throw new Error('invalid type')
    }

    formatJson(): string {
        return JSON.stringify(this.json)
    }
}

class LayoutProject {
    public types: Record<string, Type> = {}
    public fragments: StorageFragment[] = []

    constructor(private json: RawStorageLayout) {
        for (let rawFragment of json.storage) {
            this.parseRawFragment(rawFragment)
        }
    }

    parseRawFragment(rawFragment: RawStorageItem, parent?: Slot) {
        let rawType = this.json.types[rawFragment.type]
        assert(rawType != null)

        let slot: IndexSlot = {
            kind: SlotKind.Index,
            index: BigInt(rawFragment.slot),
            offset: rawFragment.offset,
            type: rawFragment.type,
            lable: rawFragment.label,
            parent,
        }

        this.parseRawType(slot)
    }

    parseRawType(slot: Slot) {
        let rawType = this.json.types[slot.type]
        assert(rawType != null)

        if (rawType.members != null) {
            assert(rawType.encoding === 'inplace')
            this.types[slot.type] = {
                kind: TypeKind.Struct,
                label: rawType.label,
                numberOfBytes: BigInt(rawType.numberOfBytes),
                members: rawType.members.map((m) => {
                    this.parseRawFragment(m, slot)
                    return {
                        name: m.label,
                        type: m.type,
                    }
                }),
            }
        } else if (rawType.encoding === 'mapping') {
            assert(rawType.key != null)
            assert(rawType.value != null)
            this.types[slot.type] = {
                kind: TypeKind.Mapping,
                key: rawType.key,
                value: rawType.value,
                label: rawType.label,
                numberOfBytes: BigInt(rawType.numberOfBytes),
            }

            let itemSlot: ArraySlot = {
                kind: SlotKind.Array,
                type: rawType.value,
                lable: 'item',
                parent: slot,
            }

            this.parseRawType(itemSlot)
        } else if (rawType.encoding === 'dynamic_array') {
            assert(rawType.base != null)
            this.types[slot.type] = {
                kind: TypeKind.DynamicArray,
                type: rawType.base,
                label: rawType.label,
                numberOfBytes: BigInt(rawType.numberOfBytes),
            }

            let lengthSlot: ArraySlot = {
                kind: SlotKind.Array,
                type: 't_uint256',
                lable: 'length',
                parent: slot,
            }

            this.fragments.push({
                name: getSlotName(lengthSlot),
                slot: lengthSlot,
            })

            let itemSlot: ArraySlot = {
                kind: SlotKind.Array,
                type: rawType.base,
                lable: 'item',
                parent: slot,
            }

            this.parseRawType(itemSlot)
        } else if (rawType.base != null) {
            assert(rawType.encoding === 'inplace')

            this.types[slot.type] = {
                kind: TypeKind.Array,
                type: rawType.base,
                label: rawType.label,
                numberOfBytes: BigInt(rawType.numberOfBytes),
            }

            let itemSlot: ArraySlot = {
                kind: SlotKind.Array,
                type: rawType.base,
                lable: 'item',
                parent: slot,
            }

            this.parseRawType(itemSlot)
        } else {
            this.types[slot.type] = {
                kind: TypeKind.Primitive,
                primitive: rawType.label as Primitive,
                label: rawType.label,
                numberOfBytes: BigInt(rawType.numberOfBytes),
            }

            this.fragments.push({
                name: getSlotName(slot),
                slot,
            })
        }
    }
}

function getSlotName(slot: Slot) {
    let path: string[] = []
    let s: Slot | undefined = slot
    while (s != null) {
        path.push(s.lable)
        s = s.parent
    }

    return path.reverse().join('.')
}

new StorageLayout({
    storage: [
        {
            label: 'x',
            offset: 0,
            slot: '0',
            type: 't_uint256',
        },
        {
            label: 'y',
            offset: 0,
            slot: '1',
            type: 't_uint256',
        },
        {
            label: 's',
            offset: 0,
            slot: '2',
            type: 't_struct(S)13_storage',
        },
        {
            label: 'addr',
            offset: 0,
            slot: '6',
            type: 't_address',
        },
        {
            label: 'map',
            offset: 0,
            slot: '7',
            type: 't_mapping(t_uint256,t_mapping(t_address,t_bool))',
        },
        {
            label: 'array',
            offset: 0,
            slot: '8',
            type: 't_array(t_string_storage)dyn_storage',
        },
        {
            label: 's1',
            offset: 0,
            slot: '9',
            type: 't_string_storage',
        },
        {
            label: 'b1',
            offset: 0,
            slot: '10',
            type: 't_bytes_storage',
        },
    ],
    types: {
        t_address: {
            encoding: 'inplace',
            label: 'address',
            numberOfBytes: '20',
        },
        't_array(t_string_storage)dyn_storage': {
            base: 't_string_storage',
            encoding: 'dynamic_array',
            label: 'string[]',
            numberOfBytes: '32',
        },
        't_array(t_uint256)2_storage': {
            base: 't_uint256',
            encoding: 'inplace',
            label: 'uint256[2]',
            numberOfBytes: '64',
        },
        't_array(t_uint256)dyn_storage': {
            base: 't_uint256',
            encoding: 'dynamic_array',
            label: 'uint256[]',
            numberOfBytes: '32',
        },
        t_bool: {
            encoding: 'inplace',
            label: 'bool',
            numberOfBytes: '1',
        },
        t_bytes_storage: {
            encoding: 'bytes',
            label: 'bytes',
            numberOfBytes: '32',
        },
        't_mapping(t_address,t_bool)': {
            encoding: 'mapping',
            key: 't_address',
            label: 'mapping(address => bool)',
            numberOfBytes: '32',
            value: 't_bool',
        },
        't_mapping(t_uint256,t_mapping(t_address,t_bool))': {
            encoding: 'mapping',
            key: 't_uint256',
            label: 'mapping(uint256 => mapping(address => bool))',
            numberOfBytes: '32',
            value: 't_mapping(t_address,t_bool)',
        },
        t_string_storage: {
            encoding: 'bytes',
            label: 'string',
            numberOfBytes: '32',
        },
        't_struct(S)13_storage': {
            encoding: 'inplace',
            label: 'struct A.S',
            members: [
                {
                    label: 'a',
                    offset: 0,
                    slot: '0',
                    type: 't_uint128',
                },
                {
                    label: 'b',
                    offset: 16,
                    slot: '0',
                    type: 't_uint128',
                },
                {
                    label: 'staticArray',
                    offset: 0,
                    slot: '1',
                    type: 't_array(t_uint256)2_storage',
                },
                {
                    label: 'dynArray',
                    offset: 0,
                    slot: '3',
                    type: 't_array(t_uint256)dyn_storage',
                },
            ],
            numberOfBytes: '128',
        },
        t_uint128: {
            encoding: 'inplace',
            label: 'uint128',
            numberOfBytes: '16',
        },
        t_uint256: {
            encoding: 'inplace',
            label: 'uint256',
            numberOfBytes: '32',
        },
    },
})
