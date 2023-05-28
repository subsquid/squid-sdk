import assert from 'assert'
import {unexpectedCase} from '@subsquid/util-internal'
import {toJSON} from '@subsquid/util-internal-json'

export interface RawStorageFragment {
    label: string
    offset: number
    slot: string
    type: string
}

export interface StorageFragment {
    label: string
    offset: number
    slot: bigint
    type: string
}

export interface RawStorageType {
    encoding: string
    label: string
    numberOfBytes: string
    key?: string
    value?: string
    base?: string
    members?: RawStorageFragment[]
}

interface TypeInfo {
    encoding: string
    label: string
    numberOfBytes: bigint
}

export interface InplaceType extends TypeInfo {
    encoding: 'inplace'
    base?: string
    members?: StorageFragment[]
}

export interface MappingType extends TypeInfo {
    encoding: 'mapping'
    key: string
    value: string
}

export interface DynamicArrayType extends TypeInfo {
    encoding: 'dynamic_array'
    base: string
}

export interface BytesType extends TypeInfo {
    encoding: 'bytes'
}

export type StorageType = InplaceType | MappingType | DynamicArrayType | BytesType

export class TypeRegistry {
    public readonly definitions: Record<string, StorageType> = {}

    constructor(types: Record<string, RawStorageType>) {
        for (let [name, type] of Object.entries(types)) {
            switch (type.encoding) {
                case 'inplace':
                    this.definitions[name] = {
                        encoding: 'inplace',
                        label: type.label,
                        numberOfBytes: BigInt(type.numberOfBytes),
                        base: type.base,
                        members: type.members?.map((m) => ({
                            label: m.label,
                            offset: m.offset,
                            slot: BigInt(m.slot),
                            type: m.type,
                        })),
                    }
                case 'mapping':
                    assert(type.key != null)
                    assert(type.value != null)
                    this.definitions[name] = {
                        encoding: 'mapping',
                        label: type.label,
                        numberOfBytes: BigInt(type.numberOfBytes),
                        key: type.key,
                        value: type.value,
                    }
                case 'dynamic_array':
                    assert(type.base != null)
                    this.definitions[name] = {
                        encoding: 'dynamic_array',
                        label: type.label,
                        numberOfBytes: BigInt(type.numberOfBytes),
                        base: type.base,
                    }
                case 'bytes':
                    this.definitions[name] = {
                        encoding: 'bytes',
                        label: type.label,
                        numberOfBytes: BigInt(type.numberOfBytes),
                    }
                default:
                    throw unexpectedCase(type.encoding)
            }
        }
    }

    get(name: string): StorageType {
        let type = this.definitions[name]
        assert(type !== null, `missing type ${name}`)
        return type
    }
}

export interface RawStorageLayout {
    storage: RawStorageFragment[]
    types: Record<string, RawStorageType>
}

export class StorageLayout {
    public readonly storage: StorageFragment[]
    public readonly types: TypeRegistry

    constructor(layout: RawStorageLayout) {
        this.storage = layout.storage.map((s) => ({
            label: s.label,
            offset: s.offset,
            slot: BigInt(s.slot),
            type: s.type,
        }))

        this.types = new TypeRegistry(layout.types)
    }

    toJSON() {
        return JSON.stringify({
            storage: toJSON(this.storage),
            types: toJSON(this.types.definitions),
        })
    }
}
