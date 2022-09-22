export type Name = string


export type Model = Record<Name, Entity | JsonObject | Interface | Union | Enum | FTS_Query>


export interface Entity extends TypeMeta {
    kind: 'entity'
    properties: Record<Name, Prop>
    interfaces?: Name[]
    indexes?: Index[]
    cardinality?: number
}


export interface JsonObject extends TypeMeta {
    kind: 'object'
    properties: Record<Name, Prop>
    interfaces?: Name[]
}


export interface Interface extends TypeMeta {
    kind: 'interface'
    properties: Record<Name, Prop>
    queryable?: boolean
}


export interface Union extends TypeMeta {
    kind: 'union'
    variants: Name[]
}


export interface Enum extends TypeMeta {
    kind: 'enum'
    values: Record<string, {}>
}


export interface TypeMeta {
    description?: string
}


export interface Prop {
    type: PropType
    nullable: boolean
    description?: string
    /**
     * Whether the values in the column must be unique. Applicable only to entities.
     */
    unique?: boolean
    /**
     * Characteristic number of elements in a `list-lookup` or in a `list` of objects
     */
    cardinality?: number
    /**
     * Relative byte size of a scalar value or scalar list
     */
    byteWeight?: number
}


export type PropType =
    ScalarPropType |
    EnumPropType |
    ListPropType |
    ObjectPropType |
    UnionPropType |
    FkPropType |
    LookupPropType |
    ListLookupPropType


export interface ScalarPropType {
    kind: 'scalar'
    name: Scalar
}


export type Scalar = 'ID' | 'String' | 'Int' | 'Float' | 'Boolean' | 'DateTime' | 'BigInt' | 'JSON' | 'Bytes' | 'BigDecimal'


export interface EnumPropType {
    kind: 'enum'
    name: Name
}


export interface ObjectPropType {
    kind: 'object'
    name: Name
}


export interface UnionPropType {
    kind: 'union'
    name: Name
}


export interface ListPropType {
    kind: 'list'
    item: Prop
}


export interface FkPropType {
    kind: 'fk'
    entity: Name
}


export interface LookupPropType {
    kind: 'lookup'
    entity: Name
    field: Name
}


export interface ListLookupPropType {
    kind: 'list-lookup'
    entity: Name
    field: Name
}


export interface FTS_Query {
    kind: 'fts'
    sources: FTS_Source[]
}


export interface FTS_Source {
    entity: Name
    fields: Name[]
}


export interface Index {
    fields: IndexField[]
    unique?: boolean
}


export interface IndexField {
    name: string
}
