import {Primitive, Type, TypeKind} from "@subsquid/scale-codec"
import {normalizeMetadataTypes} from "@subsquid/substrate-metadata/lib/util"
import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"
import {FieldFor_PortableForm, PortableType, VariantFor_PortableForm} from "./schema/interfaces"


export function makeValidator<T>(schema: JSONSchemaType<T>): ValidateFunction<T> {
    let ajv = new Ajv({
        messages: true,
        removeAdditional: false,
        verbose: true,
        validateFormats: false  // the schema fails on uint32
    })

    return ajv.compile(schema)
}


export function printValidationErrors(validator: ValidateFunction, separator = ', '): string {
    if (!validator.errors?.length) return ''
    return validator.errors.map((e) => `data${e.instancePath} ${e.message}`)
        .reduce((text, msg) => text + separator + msg)
}


export function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
}


function normalizeFields(fields: FieldFor_PortableForm[]) {
    return fields.map(field => {
        return {
            type: field.type,
            name: field.name === null ? undefined : field.name
        }
    })
}


function normalizeVariants(variants: VariantFor_PortableForm[]) {
    return variants.map(variant => {
        let fields = normalizeFields(variant.fields || [])
        return {
            ...variant,
            fields
        }
    })
}


export function normalizePortableTypes(portableTypes: PortableType[]): Type[] {
    let types: Type[] = portableTypes.map(type => {
        let def = type.type.def
        if ('composite' in def) {
            let fields = normalizeFields(def.composite.fields || [])
            return {
                kind: TypeKind.Composite,
                fields
            }
        } else if ('variant' in def) {
            return {
                kind: TypeKind.Variant,
                variants: normalizeVariants(def.variant.variants|| [])
            }
        } else if ('sequence' in def) {
            return {
                kind: TypeKind.Sequence,
                type: def.sequence.type
            }
        } else if ('array' in def) {
            return {
                kind: TypeKind.Array,
                len: def.array.len,
                type: def.array.type
            }
        } else if ('tuple' in def) {
            return {
                kind: TypeKind.Tuple,
                tuple: def.tuple
            }
        } else if ('primitive' in def) {
            return {
                kind: TypeKind.Primitive,
                primitive: capitalize(def.primitive) as Primitive
            }
        } else if ('compact' in def) {
            return {
                kind: TypeKind.Compact,
                type: def.compact.type
            }
        } else if ('bitsequence' in def) {
            return {
                kind: TypeKind.BitSequence,
                bitStoreType: def.bitsequence.bit_store_type,
                bitOrderType: def.bitsequence.bit_order_type
            }
        } else {
            throw new Error("Unknown variant")
        }
    })
    return normalizeMetadataTypes(types)
}
