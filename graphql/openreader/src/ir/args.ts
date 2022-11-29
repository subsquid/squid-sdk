export interface SqlArguments {
    offset?: number
    limit?: number
    orderBy?: OrderBy
    where?: Where
}


export type Where = AndCondition | OrCondition | InCondition | SetCondition | RefCondition | BinaryCondition | UnaryCondition


export interface AndCondition {
    op: 'AND'
    args: Where[]
}


export interface OrCondition {
    op: 'OR'
    args: Where[]
}


export interface SetCondition {
    op: 'some' | 'every' | 'none'
    field: string
    where?: Where
}


export interface RefCondition {
    op: 'REF'
    field: string
    where: Where
}


export interface InCondition {
    op: 'in' | 'not_in'
    field: string
    values: unknown[]
}


export interface BinaryCondition {
    op: BinaryOp
    field: string
    value: unknown
}


export interface UnaryCondition {
    op: UnaryOp
    field: string
    yes: boolean
}


export type BinaryOp =
    'eq' |
    'not_eq' |
    'gt' |
    'gte' |
    'lt' |
    'lte' |
    'contains' | 'not_contains' |
    'containsInsensitive' | 'not_containsInsensitive' |
    'startsWith' | 'not_startsWith' |
    'endsWith' | 'not_endsWith' |
    'containsAll' |
    'containsAny' |
    'containsNone' |
    'jsonContains' |
    'jsonHasKey'


export type UnaryOp = 'isNull'


export interface OrderBy {
    [field: string]: SortOrder | OrderBy
}


export type SortOrder = "ASC" | "DESC"
