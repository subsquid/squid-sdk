import {unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {Where} from '../../ir/args'
import {ensureArray} from '../../util/util'
import {toCondition} from '../common'

export function parseWhere(whereArg?: any): Where | undefined {
    if (whereArg == null) return undefined
    let {and, or, ...fields} = whereArg
    let conj: Where[] = []

    for (let key in fields) {
        let arg = fields[key]
        let {field, op} = parseWhereKey(key)
        switch (op) {
            case 'REF':
                if (typeof arg === 'object') {
                    let where = parseWhere(arg)
                    where && conj.push({op, field, where})
                } else {
                    conj.push({op: 'eq', field, value: arg})
                }
                break
            case 'every': {
                let where = parseWhere(arg)
                where && conj.push({op, field, where})
                break
            }
            case 'some':
            case 'none':
                conj.push({op, field, where: parseWhere(arg)})
                break
            case 'in':
            case 'not_in':
                conj.push({op, field, values: ensureArray(arg)})
                break
            case 'not':
                conj.push({op: 'not_eq', field, value: arg})
                break
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
            case 'contains':
            case 'not_contains':
                conj.push({op, field, value: arg})
                break
            case 'contains_nocase':
                conj.push({op: 'containsInsensitive', field, value: arg})
                break
            case 'not_contains_nocase':
                conj.push({op: 'not_containsInsensitive', field, value: arg})
                break
            case 'starts_with':
                conj.push({op: 'startsWith', field, value: arg})
                break
            case 'starts_with_nocase':
                conj.push({op: 'startsWithInsensitive', field, value: arg})
                break
            case 'not_starts_with':
                conj.push({op: 'not_startsWith', field, value: arg})
                break
            case 'not_starts_with_nocase':
                conj.push({op: 'not_startsWithInsensitive', field, value: arg})
                break
            case 'ends_with':
                conj.push({op: 'endsWith', field, value: arg})
                break
            case 'ends_with_nocase':
                conj.push({op: 'endsWithInsensitive', field, value: arg})
                break
            case 'not_ends_with':
                conj.push({op: 'not_endsWith', field, value: arg})
                break
            case 'not_ends_with_nocase':
                conj.push({op: 'not_endsWithInsensitive', field, value: arg})
                break
            case 'jsonHasKey':
            case 'jsonContains':
                conj.push({op, field, value: arg})
                break
            case 'containsNone':
            case 'containsAll':
            case 'containsAny':
                conj.push({op, field, value: ensureArray(arg)})
                break
            case 'isNull':
                assert(typeof arg == 'boolean')
                conj.push({op, field, yes: arg})
                break
            default:
                throw unexpectedCase(op)
        }
    }

    if (and) {
        for (let arg of ensureArray(and)) {
            let where = parseWhere(arg)
            if (where) {
                conj.push(where)
            }
        }
    }

    let conjunction = toCondition('AND', conj)
    if (or) {
        let disjunctions: Where[] = []
        if (conjunction) {
            disjunctions.push(conjunction)
        }
        for (let arg of ensureArray(or)) {
            let where = parseWhere(arg)
            if (where) {
                disjunctions.push(where)
            }
        }
        return toCondition('OR', disjunctions)
    } else {
        return conjunction
    }
}

export function parseWhereKey(key: string): {op: (typeof WHERE_OPS)[number] | 'REF'; field: string} {
    let m = WHERE_KEY_REGEX.exec(key)
    if (m) {
        return {op: m[2] as (typeof WHERE_OPS)[number], field: m[1]}
    } else {
        return {op: 'REF', field: key}
    }
}

const WHERE_OPS = [
    'not',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
    'not_in',
    'contains',
    'contains_nocase',
    'not_contains',
    'not_contains_nocase',
    'starts_with',
    'starts_with_nocase',
    'not_starts_with',
    'not_starts_with_nocase',
    'ends_with',
    'ends_with_nocase',
    'not_ends_with',
    'not_ends_with_nocase',
    'containsAll',
    'containsAny',
    'containsNone',
    'jsonContains',
    'jsonHasKey',
    'isNull',
    'some',
    'every',
    'none',
] as const

const WHERE_KEY_REGEX = (() => {
    return new RegExp(`^([^_]*)_(${WHERE_OPS.join('|')})$`)
})()
