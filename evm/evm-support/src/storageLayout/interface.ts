import assert from 'assert'
import {unexpectedCase} from '@subsquid/util-internal'
import {decodeHex} from '@subsquid/util-internal-hex'
import {toJSON} from '@subsquid/util-internal-json'
import {HexSink, Src, decodeElementary, encodeElementary} from './codec'
import {normalizeElementaryType} from './util'

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

export interface StructInplaceType extends InplaceType {
    encoding: 'inplace'
    base?: never
    members: StorageFragment[]
}

export interface ArrayInplaceType extends InplaceType {
    encoding: 'inplace'
    base: string
    members?: never
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
                    break
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
                    break
                case 'dynamic_array':
                    assert(type.base != null)
                    this.definitions[name] = {
                        encoding: 'dynamic_array',
                        label: type.label,
                        numberOfBytes: BigInt(type.numberOfBytes),
                        base: type.base,
                    }
                    break
                case 'bytes':
                    this.definitions[name] = {
                        encoding: 'bytes',
                        label: type.label,
                        numberOfBytes: BigInt(type.numberOfBytes),
                    }
                    break
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

    padKey(type: string | StorageType, key: any) {
        type = typeof type === 'string' ? this.types.get(type) : type

        let sink = new HexSink()

        switch (type.label) {
            case 'bytes': {
                let bytes = typeof key === 'string' ? decodeHex(key) : key
                sink.bytes(bytes)
                break
            }
            case 'string': {
                sink.str(key)
                break
            }
            default: {
                let elementary = normalizeElementaryType(type.label)
                encodeElementary(elementary, key, sink)
                sink.bytes(new Uint8Array(32 - sink.length)) // left-pad with zeros.
            }
        }

        return sink.toHex()
    }

    decodeValue(type: string | StorageType, value: string, offset: number): any {
        type = typeof type === 'string' ? this.types.get(type) : type

        let src = new Src(value)
        assert(src.length == 32)

        switch (type.encoding) {
            case 'inplace':
                return this.decodeInplace(type, offset, src)
            case 'dynamic_array':
                return src.u256()
            case 'bytes':
                return this.decodeBytes(type, src)
            case 'mapping':
                throw new Error(`unable to decode mapping type`)
            default:
                throw unexpectedCase()
        }
    }

    private decodeInplace(type: InplaceType, offset: number, src: Src) {
        src.skip(offset)

        let elemenentary = normalizeElementaryType(type.label)
        return decodeElementary(elemenentary, src)
    }

    private decodeBytes(type: BytesType, src: Src) {
        let lenByte = src.u8()

        if (lenByte % 2 === 0) {
            // bytes are stored in slot
            let length = lenByte / 2
            src.skip(31 - length) // skip zeros

            switch (type.label) {
                case 'bytes':
                    return src.bytes(length)
                case 'string':
                    return src.str(length)
                default:
                    throw unexpectedCase(type.label)
            }
        } else {
            // only length is stored in slot
            src.skip(-1) // move cursor back

            let length: bigint = decodeElementary('uint', src)
            return (length - 1n) / 2n
        }
    }

    toJSON() {
        return JSON.stringify({
            storage: toJSON(this.storage),
            types: toJSON(this.types.definitions),
        })
    }
}
