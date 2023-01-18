import {getUnwrappedType} from '@subsquid/scale-codec/lib/types-codec'
import {assertNotNull, def, last, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import type {
    EventMetadataV9,
    FunctionMetadataV9,
    Metadata,
    MetadataV14,
    ModuleMetadataV10,
    ModuleMetadataV11,
    ModuleMetadataV12,
    ModuleMetadataV13,
    ModuleMetadataV9
} from './interfaces'
import {OldTypeRegistry} from './old/typeRegistry'
import {OldTypes} from './old/types'
import {Storage, StorageHasher, StorageItem} from './storage'
import {Field, Ti, Type, TypeKind, Variant} from './types'
import {isUnitType, normalizeMetadataTypes} from './util'


export interface ChainDescription {
    types: Type[]
    call: Ti
    digest: Ti
    digestItem: Ti
    event: Ti
    eventRecord: Ti
    eventRecordList: Ti
    signature: Ti
    storage: Storage
    constants: Constants
}


export interface Constants {
    [pallet: string]: {
        [name: string]: Constant
    }
}


export interface Constant {
    type: Ti
    value: Uint8Array
    docs: string[]
}



export function getChainDescriptionFromMetadata(metadata: Metadata, oldTypes?: OldTypes): ChainDescription {
    switch(metadata.__kind) {
        case "V9":
        case "V10":
        case "V11":
        case "V12":
        case "V13":
            assert(oldTypes, `Type definitions are required for metadata ${metadata.__kind}`)
            return new FromOld(metadata, oldTypes).convert()
        case "V14":
            return new FromV14(metadata.value).convert()
        default:
            throw new Error(`Unsupported metadata version: ${metadata.__kind}`)
    }
}


class FromV14 {
    constructor(private metadata: MetadataV14) {}

    convert(): ChainDescription {
        return {
            types: this.types(),
            call: this.call(),
            digest: this.digest(),
            digestItem: this.digestItem(),
            event: this.event(),
            eventRecord: this.eventRecord(),
            eventRecordList: this.eventRecordList(),
            signature: this.signature(),
            storage: this.storage(),
            constants: this.constants()
        }
    }

    @def
    private digest(): Ti {
        return this.getStorageItem('System', 'Digest').value
    }

    @def
    private digestItem(): Ti {
        let digest = this.types()[this.digest()]
        assert(digest.kind == TypeKind.Composite)
        for (let field of digest.fields) {
            if (field.name == 'logs') {
                let seq = this.types()[field.type]
                assert(seq.kind == TypeKind.Sequence)
                return seq.type
            }
        }
        assert(false, `Can't extract DigestItem from Digest`)
    }

    @def
    private event(): Ti {
        let rec = this.types()[this.eventRecord()]
        assert(rec.kind == TypeKind.Composite)
        let eventField = rec.fields.find(f => f.name == 'event')
        assert(eventField != null)
        return eventField.type
    }

    @def
    private eventRecord(): Ti {
        let types = this.types()
        let eventRecordList = this.eventRecordList()
        let seq = types[eventRecordList]
        assert(seq.kind == TypeKind.Sequence)
        return seq.type
    }

    @def
    private eventRecordList(): Ti {
        return this.getStorageItem('System', 'Events').value
    }

    @def
    private signature(): Ti {
        let types = this.types()

        let signedExtensionsType: Type = {
            kind: TypeKind.Composite,
            fields: this.metadata.extrinsic.signedExtensions.map(ext => {
                return {
                    name: ext.identifier,
                    type: ext.type
                }
            }).filter(f => {
                return !isUnitType(getUnwrappedType(types, f.type))
            }),
            path: ['SignedExtensions']
        }

        let signedExtensions = types.push(signedExtensionsType) - 1

        let signatureType: Type = {
            kind: TypeKind.Composite,
            fields: [
                {
                    name: "address",
                    type: this.address(),
                },
                {
                    name: "signature",
                    type: this.extrinsicSignature(),
                },
                {
                    name: 'signedExtensions',
                    type: signedExtensions
                }
            ],
            path: ['ExtrinsicSignature']
        }

        return types.push(signatureType) - 1
    }

    @def
    private address(): Ti {
        return this.getTypeParameter(this.uncheckedExtrinsic(), 0)
    }

    @def
    private call(): Ti {
        return this.getTypeParameter(this.uncheckedExtrinsic(), 1)
    }

    @def
    private extrinsicSignature(): Ti {
        return this.getTypeParameter(this.uncheckedExtrinsic(), 2)
    }

    @def
    private uncheckedExtrinsic(): Ti {
        let candidates = []
        for (let i = 0; i < this.metadata.lookup.types.length; i++) {
            let def = this.metadata.lookup.types[i].type
            if (def.path[0] == 'sp_runtime' && last(def.path) == 'UncheckedExtrinsic') {
                candidates.push(i)
            }
        }
        switch(candidates.length) {
            case 0: throw new Error(`Failed to find UncheckedExtrinsic type in metadata`)
            case 1: return candidates[0]
            default:
                return candidates.includes(this.metadata.extrinsic.type)
                    ? this.metadata.extrinsic.type
                    : candidates[0]
        }
    }

    private getTypeParameter(ti: Ti, idx: number): Ti {
        let def = this.metadata.lookup.types[ti]
        if (def.type.params.length <= idx) {
            let name = def.type.path.length ? def.type.path.join('::') : ''+ti
            throw new Error(
                `Type ${name} should have at least ${idx + 1} type parameter${idx > 0 ? 's' : ''}`
            )
        }
        return assertNotNull(def.type.params[idx].type)
    }

    private getStorageItem(prefix: string, name: string): StorageItem {
        let storage = this.storage()
        let item = storage[prefix]?.[name]
        return assertNotNull(item, `Can't find ${prefix}.${name} storage item`)
    }

    @def
    private storage(): Storage {
        let storage: Storage = {}
        this.metadata.pallets.forEach(pallet => {
            if (pallet.storage == null) return
            let items: Record<string, StorageItem> = storage[pallet.storage.prefix] = {}
            pallet.storage.items.forEach(e => {
                let hashers: StorageHasher[]
                let keys: Ti[]
                switch(e.type.__kind) {
                    case 'Plain':
                        hashers = []
                        keys = []
                        break
                    case 'Map':
                        hashers = e.type.hashers.map(h => h.__kind)
                        if (hashers.length == 1) {
                            keys = [e.type.key]
                        } else {
                            let keyDef = this.types()[e.type.key]
                            assert(keyDef.kind == TypeKind.Tuple)
                            assert(keyDef.tuple.length == hashers.length)
                            keys = keyDef.tuple
                        }
                        break
                    default:
                        throw unexpectedCase()
                }
                items[e.name] = {
                    modifier: e.modifier.__kind,
                    hashers,
                    keys,
                    value: e.type.value,
                    fallback: e.fallback,
                    docs: e.docs
                }
            })
        })
        return storage
    }

    @def
    private constants(): Constants {
        let constants: Constants = {}
        this.metadata.pallets.forEach(pallet => {
            pallet.constants.forEach(c => {
                let pc = constants[pallet.name] || (constants[pallet.name] = {})
                pc[c.name] = {
                    type: c.type,
                    value: c.value,
                    docs: c.docs
                }
            })
        })
        return constants
    }

    @def
    private types(): Type[] {
        let types: Type[] = this.metadata.lookup.types.map(t => {
            let info = {
                path: t.type.path,
                docs: t.type.docs
            }
            let def = t.type.def
            switch(def.__kind) {
                case 'Primitive':
                    return {
                        kind: TypeKind.Primitive,
                        primitive: def.value.__kind,
                        ...info
                    }
                case "Compact":
                    return {
                        kind: TypeKind.Compact,
                        type: def.value.type,
                        ...info
                    }
                case "Sequence":
                    return {
                        kind: TypeKind.Sequence,
                        type: def.value.type,
                        ...info
                    }
                case "BitSequence":
                    return {
                        kind: TypeKind.BitSequence,
                        bitStoreType: def.value.bitStoreType,
                        bitOrderType: def.value.bitOrderType,
                        ...info
                    }
                case "Array":
                    return {
                        kind: TypeKind.Array,
                        type: def.value.type,
                        len: def.value.len,
                        ...info
                    }
                case "Tuple":
                    return {
                        kind: TypeKind.Tuple,
                        tuple: def.value,
                        ...info
                    }
                case "Composite":
                    return {
                        kind: TypeKind.Composite,
                        fields: def.value.fields,
                        ...info
                    }
                case "Variant":
                    return {
                        kind: TypeKind.Variant,
                        variants: def.value.variants,
                        ...info
                    }
                default:
                    throw unexpectedCase((def as any).__kind)
            }
        })

        return normalizeMetadataTypes(types)
    }
}


class FromOld {
    private registry: OldTypeRegistry

    constructor(private metadata: Metadata, private oldTypes: OldTypes) {
        this.registry = new OldTypeRegistry(oldTypes)
        this.defineGenericExtrinsicEra()
        this.defineGenericLookupSource()
        this.defineOriginCaller()
        this.defineGenericCall()
        this.defineGenericEvent()
        this.defineGenericSignature()
    }

    convert(): ChainDescription {
        let signature = this.registry.use('GenericSignature')
        let call = this.registry.use('GenericCall')
        let digest = this.registry.use('Digest')
        let digestItem = this.registry.use('DigestItem')
        let event = this.registry.use('GenericEvent')
        let eventRecord = this.registry.use('EventRecord')
        let eventRecordList = this.registry.use('Vec<EventRecord>')
        let storage = this.storage()
        let constants = this.constants()
        return {
            types: this.registry.getTypes(),
            call,
            digest,
            digestItem,
            event,
            eventRecord,
            eventRecordList,
            signature,
            storage,
            constants
        }
    }

    private defineGenericSignature(): void {
        this.registry.define("GenericSignature", () => {
            return {
                kind: TypeKind.Composite,
                fields: [
                    {
                        name: "address",
                        type: this.registry.use("Address")
                    },
                    {
                        name: "signature",
                        type: this.registry.use("ExtrinsicSignature")
                    },
                    {
                        name: 'signedExtensions',
                        type: this.signedExtensions()
                    }
                ]
            }
        })
    }

    @def
    private signedExtensions(): Ti {
        let fields: Field[] = []
        switch(this.metadata.__kind) {
            case "V9":
            case "V10":
                this.addSignedExtensionField(fields, 'CheckEra')
                this.addSignedExtensionField(fields, 'CheckNonce')
                this.addSignedExtensionField(fields, 'ChargeTransactionPayment')
                break
            case "V11":
            case "V12":
            case "V13":
                this.metadata.value.extrinsic.signedExtensions.forEach(name => {
                    this.addSignedExtensionField(fields, name)
                })
                break
            default:
                throw unexpectedCase(this.metadata.__kind)
        }
        return this.registry.add({
            kind: TypeKind.Composite,
            fields
        })
    }

    private addSignedExtensionField(fields: Field[], name: string): void {
        let type = this.getSignedExtensionType(name)
        if (type == null) return
        fields.push({name, type})
    }

    private getSignedExtensionType(name: string): Ti | undefined {
        let def = this.oldTypes.signedExtensions?.[name]
        if (def) return this.registry.use(def)
        switch(name) {
            case 'ChargeTransactionPayment':
                return this.registry.use('Compact<Balance>')
            case 'CheckMortality':
            case 'CheckEra':
                return this.registry.use('ExtrinsicEra')
            case 'CheckNonce':
                return this.registry.use('Compact<Index>')
            case 'CheckBlockGasLimit':
            case 'CheckGenesis':
            case 'CheckNonZeroSender':
            case 'CheckSpecVersion':
            case 'CheckTxVersion':
            case 'CheckVersion':
            case 'CheckWeight':
            case 'LockStakingStatus':
            case 'ValidateEquivocationReport':
                return undefined
            default:
                throw new Error('Unknown signed extension: ' + name)
        }
    }

    private defineGenericExtrinsicEra(): void {
        this.registry.define('GenericExtrinsicEra', () => {
            let variants: Variant[] = []

            variants.push({
                name: 'Immortal',
                fields: [],
                index: 0
            })

            for (let index = 1; index < 256; index++) {
                variants.push({
                    name: 'Mortal' + index,
                    fields: [
                        {type: this.registry.use('U8')}
                    ],
                    index
                })
            }

            return {
                kind: TypeKind.Variant,
                variants
            }
        })
    }

    private defineGenericCall(): void {
        this.registry.define('GenericCall', () => {
            let variants: Variant[] = []
            this.forEachPallet(mod => mod.calls, (mod, index) => {
                variants.push({
                    name: mod.name,
                    index,
                    fields: [{
                        type: this.makeCallEnum(mod.name, mod.calls!)
                    }]
                })
            })
            return {
                kind: TypeKind.Variant,
                variants: variants
            }
        })
    }

    private defineGenericEvent(): void {
        this.registry.define('GenericEvent', () => {
            let variants: Variant[] = []
            this.forEachPallet(mod => mod.events?.length, (mod, index) => {
                variants.push({
                    name: mod.name,
                    index,
                    fields: [{
                        type: this.makeEventEnum(mod.name, mod.events!)
                    }]
                })
            })
            return {
                kind: TypeKind.Variant,
                variants
            }
        })
    }

    private makeEventEnum(palletName: string, events: EventMetadataV9[]): Ti {
        let variants = events.map((e, index) => {
            let fields = e.args.map(arg => {
                return {
                    type: this.registry.use(arg, palletName)
                }
            })
            return {
                index,
                name: e.name,
                fields,
                docs: e.docs
            }
        })
        return this.registry.add({
            kind: TypeKind.Variant,
            variants
        })
    }

    private makeCallEnum(palletName: string, calls: FunctionMetadataV9[]): Ti {
        let variants = calls.map((call, index) => {
            let fields = call.args.map(arg => {
                return {
                    name: arg.name,
                    type: this.registry.use(arg.type, palletName)
                }
            })
            return {
                index,
                name: call.name,
                fields,
                docs: call.docs
            }
        })
        return this.registry.add({
            kind: TypeKind.Variant,
            variants
        })
    }

    private defineGenericLookupSource(): void {
        this.registry.define('GenericLookupSource', () => {
            let variants: Variant[] = []
            for (let i = 0; i < 0xef; i++) {
                variants.push({
                    name: 'Idx' + i,
                    fields: [],
                    index: i
                })
            }
            variants.push({
                name: 'IdxU16',
                fields: [{type: this.registry.use('U16')}],
                index: 0xfc
            })
            variants.push({
                name: 'IdxU32',
                fields: [{type: this.registry.use('U32')}],
                index: 0xfd
            })
            variants.push({
                name: 'IdxU64',
                fields: [{type: this.registry.use('U64')}],
                index: 0xfe
            })
            variants.push({
                name: 'AccountId',
                fields: [{type: this.registry.use('AccountId')}],
                index: 0xff
            })
            return {
                kind: TypeKind.Variant,
                variants
            }
        })
    }

    @def
    private storage(): Storage {
        let storage: Storage = {}
        this.forEachPallet(null, mod => {
            if (mod.storage == null) return
            let items: Record<string, StorageItem> = storage[mod.storage.prefix] || {}
            mod.storage.items.forEach(e => {
                let hashers: StorageHasher[]
                let keys: Ti[]
                switch(e.type.__kind) {
                    case 'Plain':
                        hashers = []
                        keys = []
                        break
                    case 'Map':
                        hashers = [e.type.hasher.__kind]
                        keys = [this.registry.use(e.type.key, mod.name)]
                        break
                    case 'DoubleMap':
                        hashers = [
                            e.type.hasher.__kind,
                            e.type.key2Hasher.__kind
                        ]
                        keys = [
                            this.registry.use(e.type.key1, mod.name),
                            this.registry.use(e.type.key2, mod.name)
                        ]
                        break
                    case 'NMap':
                        hashers = e.type.hashers.map(h => h.__kind)
                        keys = e.type.keyVec.map(k => this.registry.use(k, mod.name))
                        break
                    default:
                        throw unexpectedCase()
                }
                items[e.name] = {
                    modifier: e.modifier.__kind,
                    hashers,
                    keys,
                    value: this.registry.use(e.type.value, mod.name),
                    fallback: e.fallback,
                    docs: e.docs
                }
            })
            storage[mod.storage.prefix] = items
        })
        return storage
    }

    @def
    private constants(): Constants {
        let constants: Constants = {}
        this.forEachPallet(null, mod => {
            mod.constants.forEach(c => {
                let pc = constants[mod.name] || (constants[mod.name] = {})
                pc[c.name] = {
                    type: this.registry.use(c.type, mod.name),
                    value: c.value,
                    docs: c.docs
                }
            })
        })
        return constants
    }

    private defineOriginCaller(): void {
        this.registry.define('OriginCaller', () => {
            let variants: Variant[] = []
            this.forEachPallet(null, (mod, index) => {
                let name = mod.name
                let type: string
                switch(mod.name) {
                    case 'Authority':
                        type = 'AuthorityOrigin'
                        break
                    case 'Council':
                    case 'TechnicalCommittee':
                    case 'GeneralCouncil':
                        type = 'CollectiveOrigin'
                        break
                    case 'System':
                        type = 'SystemOrigin'
                        name = 'system'
                        break
                    case 'Xcm':
                    case 'XcmPallet':
                        type = 'XcmOrigin'
                        break
                    default:
                        return
                }
                variants.push({
                    name: mod.name,
                    index,
                    fields: [{
                        type: this.registry.use(type)
                    }]
                })
            })
            return {
                kind: TypeKind.Variant,
                variants,
                path: ['OriginCaller']
            }
        })
    }

    private forEachPallet(filter: ((mod: AnyOldModule) => unknown) | null | undefined, cb: (mod: AnyOldModule, index: number) => void): void {
        switch(this.metadata.__kind) {
            case 'V9':
            case 'V10':
            case 'V11': {
                let index = 0
                this.metadata.value.modules.forEach(mod => {
                    if (filter && !filter(mod)) return
                    cb(mod, index)
                    index += 1
                })
                return
            }
            case 'V12':
            case 'V13': {
                this.metadata.value.modules.forEach(mod => {
                    if (filter && !filter(mod)) return
                    cb(mod, mod.index)
                })
                return
            }
        }
    }
}


type AnyOldModule = ModuleMetadataV9 | ModuleMetadataV10 | ModuleMetadataV11 | ModuleMetadataV12 | ModuleMetadataV13
