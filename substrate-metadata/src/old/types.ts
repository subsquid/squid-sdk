export type OldTypeDefinition = OldTypeExp | OldEnumDefinition | OldStructDefinition | OldSetDefinition


export type OldTypeExp = string


export interface OldStructDefinition {
    [typeName: string]: OldTypeExp
}


export interface OldEnumDefinition {
    _enum: string[] | Record<string, OldTypeExp | OldStructDefinition | null>
    _set?: undefined
}


export interface OldSetDefinition {
    _set: {
        _bitLength: number
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
}


export type SpecVersion = number
export type SpecVersionRange = [minInclusive: SpecVersion | null, maxInclusive: SpecVersion | null]


export interface OldTypesWithSpecVersionRange extends OldTypes {
    minmax: SpecVersionRange
}


export interface OldTypesBundle extends OldTypes {
    versions?: OldTypesWithSpecVersionRange[]
}
