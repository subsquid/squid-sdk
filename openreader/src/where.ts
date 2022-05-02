
export type WhereOp =
    '-' | // no operator
    'isNull' |
    'eq' | 'not_eq' |
    'gt' |
    'gte' |
    'lt' |
    'lte' |
    'in' | 'not_in' |
    'contains' | 'not_contains' |
    'containsInsensitive' | 'not_containsInsensitive' |
    'startsWith' | 'not_startsWith' |
    'endsWith' | 'not_endsWith' |
    'containsAll' |
    'containsAny' |
    'containsNone' |
    'some' |
    'every' |
    'none' |
    'hasKey'


const ENDINGS = [
    'isNull',
    'eq',
    'not_eq',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
    'not_in',
    'contains',
    'not_contains',
    'containsInsensitive',
    'not_containsInsensitive',
    'startsWith',
    'not_startsWith',
    'endsWith',
    'not_endsWith',
    'containsAll',
    'containsAny',
    'containsNone',
    'some',
    'every',
    'none',
    'hasKey',
].sort((a, b) => b.length - a.length).map(e => '_' + e)


function parseEnding(field: string): string {
    for (let i = 0; i < ENDINGS.length; i++) {
        if (field.endsWith(ENDINGS[i])) return ENDINGS[i].slice(1)
    }
    return ''
}


export function parseWhereField(field: string): {op: WhereOp, field: string} {
    let ending = parseEnding(field)
    if (!ending) return {op: '-', field}
    let fieldName = field.slice(0, -(ending.length + 1))
    return {
        op: ending as WhereOp,
        field: fieldName
    }
}


export function hasConditions(where?: any): where is any {
    if (where == null) return false
    for (let key in where) {
        switch(key) {
            case 'AND':
            case 'OR':
                break
            default:
                return true
        }
    }
    if (Array.isArray(where.AND)) {
        if (where.AND.some(hasConditions)) return true
    } else if (where.AND && hasConditions(where.AND)) {
        return true
    }
    if (Array.isArray(where.OR)) {
        if (where.OR.some(hasConditions)) return true
    } else if (where.OR && hasConditions(where.OR)) {
        return true
    }
    return false
}


export function whereOpToSqlOperator(op: WhereOp): string {
    switch(op) {
        case 'eq':
            return '='
        case 'not_eq':
            return '!='
        case 'gt':
            return '>'
        case 'gte':
            return '>='
        case 'lt':
            return '<'
        case 'lte':
            return '<='
        case 'in':
            return 'IN'
        case 'not_in':
            return 'NOT IN'
        default:
            throw new Error(`Operator ${op} doesn't have SQL analog`)
    }
}
