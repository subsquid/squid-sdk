export type OldTypeDefinition = OldTypeExp | OldEnumDefinition | OldStructDefinition | OldSetDefinition


export type OldTypeExp = string


export interface OldStructDefinition {
    [typeName: string]: OldTypeExp
}


export interface OldEnumDefinition {
    _enum: string[] | Record<string, OldTypeExp | OldStructDefinition | null> | Record<string, number>
    _set?: undefined
}


export interface OldSetDefinition {
    _set: {
        _bitLength?: number
    }
    _enum?: undefined
}


export interface OldTypesAlias {
    [pallet: string]: {
        [typeName: string]: string
    }
}


export interface OldTypes {
    types: Record<string, OldTypeDefinition>
    typesAlias?: OldTypesAlias
    signedExtensions?: Record<string, OldTypeExp>
}


export type SpecVersionRange = [minInclusive: number | null, maxInclusive: number | null]


export interface OldTypesWithSpecVersionRange extends OldTypes {
    minmax: SpecVersionRange
}


export interface OldTypesBundle extends OldTypes {
    versions?: OldTypesWithSpecVersionRange[]
}

export type OldSpecsBundle = Record<string, OldTypesBundle>
