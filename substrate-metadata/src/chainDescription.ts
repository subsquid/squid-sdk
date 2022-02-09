import {assertNotNull, def, unexpectedCase} from "@subsquid/util"
import assert from "assert"
import type {EventMetadataV9, FunctionMetadataV9, Metadata, MetadataV14} from "./interfaces"
import {OldTypeRegistry} from "./old/typeRegistry"
import {OldTypes} from "./old/types"
import {Field, Ti, Type, TypeKind, Variant} from "./types"
import {getTypeByPath, normalizeMetadataTypes} from "./util"


export interface ChainDescription {
    types: Type[]
    call: Ti
    signature: Ti
    event: Ti
    eventRecord: Ti
    eventRecordList: Ti
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
            signature: this.signature(),
            event: this.event(),
            eventRecord: this.eventRecord(),
            eventRecordList: this.eventRecordList()
        }
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
    private call(): Ti {
        let types = this.metadata.lookup.types
        let extrinsic = this.metadata.extrinsic.type
        let params = types[extrinsic].type.params
        let call = params[1]
        assert(call?.name === 'Call', 'expected Call as a second type parameter of extrinsic type')
        return assertNotNull(call.type)
    }

    @def
    private eventRecordList(): Ti {
        let types = this.types()
        let eventRecord = this.eventRecord()
        let list = types.findIndex(type => type.kind == TypeKind.Sequence && type.type == eventRecord)
        if (list < 0) {
            list = types.push({kind: TypeKind.Sequence, type: eventRecord}) - 1
        }
        return list
    }

    @def
    private eventRecord(): Ti {
        return getTypeByPath(this.types(), ['frame_system', 'EventRecord'])
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
            }),
            path: ['SignedExtensions']
        }

        let signedExtensions = types.push(signedExtensionsType) - 1

        let signatureType: Type = {
            kind: TypeKind.Composite,
            fields: [
                {
                    name: "address",
                    type: getTypeByPath(types, ["sp_runtime", "multiaddress", "MultiAddress"]),
                },
                {
                    name: "signature",
                    type: getTypeByPath(types, ["sp_runtime", "MultiSignature"]),
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

    constructor(private metadata: Metadata, oldTypes: OldTypes) {
        this.registry = new OldTypeRegistry(oldTypes)
    }

    convert(): ChainDescription {
        // order is important
        this.extrinsicEra()
        let call = this.call()
        let event = this.event()
        let signature = this.signature()
        let eventRecord = this.registry.use('EventRecord')
        let eventRecordList = this.registry.use('Vec<EventRecord>')
        return {
            types: this.registry.getTypes(),
            call,
            signature,
            event,
            eventRecord,
            eventRecordList
        }
    }

    @def
    private call(): Ti {
        return this.registry.create('GenericCall', () => {
            let variants: Variant[] = []
            this.forEachPallet_Call((palletName, index, calls) => {
                let fields = [
                    {type: this.makeCallEnum(palletName, calls)}
                ]
                variants.push({
                    name: palletName,
                    index,
                    fields
                })
            })
            return {
                kind: TypeKind.Variant,
                variants: variants
            }
        })
    }

    @def
    private signature(): Ti {
        return this.registry.create("GenericSignature", () => {
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
                console.error('WARNING: Unknown signed extension: ' + name)
                return undefined
        }
    }

    @def
    private extrinsicEra(): Ti {
        return this.registry.create('GenericExtrinsicEra', () => {
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

    @def
    private event(): Ti {
        return this.registry.create('GenericEvent', () => {
            let variants: Variant[] = []
            this.forEachPallet_Event((palletName, index, events) => {
                variants.push({
                    name: palletName,
                    index,
                    fields: [
                        {type: assertNotNull(this.makeEventEnum(palletName, events))}
                    ]
                })
            })
            return {
                kind: TypeKind.Variant,
                variants
            }
        })
    }

    private makeEventEnum(palletName: string, events?: EventMetadataV9[]): Ti | undefined {
        if (!events?.length) return undefined
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

    private forEachPallet_Call(cb: (palletName: string, palletIndex: number, calls: FunctionMetadataV9[]) => void): void {
        switch(this.metadata.__kind) {
            case 'V9':
            case 'V10':
            case 'V11': {
                let index = 0
                this.metadata.value.modules.forEach(mod => {
                    if (!mod.calls) return
                    cb(mod.name, index, mod.calls)
                    index += 1
                })
                return
            }
            case 'V12':
            case 'V13': {
                this.metadata.value.modules.forEach(mod => {
                    if (!mod.calls) return
                    cb(mod.name, mod.index, mod.calls)
                })
                return
            }
        }
    }

    private forEachPallet_Event(cb: (palletName: string, palletIndex: number, events: EventMetadataV9[]) => void): void {
        switch(this.metadata.__kind) {
            case 'V9':
            case 'V10':
            case 'V11': {
                let index = 0
                this.metadata.value.modules.forEach(mod => {
                    if (!mod.events?.length) return
                    cb(mod.name, index, mod.events)
                    index += 1
                })
                return
            }
            case 'V12':
            case 'V13': {
                this.metadata.value.modules.forEach(mod => {
                    if (!mod.events?.length) return
                    cb(mod.name, mod.index, mod.events)
                })
                return
            }
        }
    }
}
