import {Codec as ScaleCodec, JsonCodec} from '@subsquid/scale-codec'
import {
    ChainDescription,
    decodeExtrinsic,
    getChainDescription,
    OldSpecsBundle,
    OldTypesBundle,
    QualifiedName,
    StorageItem
} from '@subsquid/substrate-metadata'
import * as eac from '@subsquid/substrate-metadata/lib/events-and-calls'
import {Bytes} from '@subsquid/substrate-raw-data'
import {unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {SpecId} from './interfaces/data-base'
import * as parsing from './parsing/types'


export class Runtime {
    public readonly specId: SpecId
    public readonly description: ChainDescription
    public readonly events: eac.Registry
    public readonly calls: eac.Registry
    public readonly scaleCodec: ScaleCodec
    public readonly jsonCodec: JsonCodec

    constructor(
        public readonly specName: string,
        public readonly specVersion: number,
        metadata: Bytes,
        typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
        this.specId = `${specName}@${specVersion}`
        this.description = getChainDescription(metadata, specName, specVersion, typesBundle)
        this.events = new eac.Registry(this.description.types, this.description.event)
        this.calls = new eac.Registry(this.description.types, this.description.call)
        this.scaleCodec = new ScaleCodec(this.description.types)
        this.jsonCodec = new JsonCodec(this.description.types)
    }

    getStorageItem(name: QualifiedName): StorageItem
    getStorageItem(prefix: string, name: string): StorageItem
    getStorageItem(prefixOrQualifiedName: string, name?: string): StorageItem {
        let prefix: string
        if (name == null) {
            let [p, n] = splitQualifiedName(prefixOrQualifiedName)
            prefix = p
            name = n
        } else {
            prefix = prefixOrQualifiedName
        }
        let items = this.description.storage[prefix]
        if (items == null) throw new Error(
            `There are no storage items under prefix ${prefix}`
        )
        let def = items[name]
        if (def == null) throw new Error(
            `Unknown storage item: ${prefix}.${name}`
        )
        return def
    }

    decodeStorageValue(item: StorageItem | QualifiedName, value?: Bytes | Uint8Array): any {
        if (typeof item == 'string') {
            item = this.getStorageItem(item)
        }
        if (value == null) {
            switch(item.modifier) {
                case 'Optional':
                    return undefined
                case 'Default':
                    value = item.fallback
                    break
                case 'Required':
                    throw new Error(`Required storage item not found`)
                default:
                    throw unexpectedCase(item.modifier)
            }
        }
        return this.scaleCodec.decodeBinary(item.value, value)
    }

    decodeExtrinsic(bytes: Bytes | Uint8Array): parsing.Extrinsic {
        return decodeExtrinsic(bytes, this.description, this.scaleCodec)
    }
}


function splitQualifiedName(name: QualifiedName): [prefix: string, name: string] {
    let split = name.split('.')
    assert(split.length == 2)
    return split as [string, string]
}
