import {unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {Where} from '../../ir/args'
import {ensureArray} from '../../util/util'
import {parseWhereKey, toCondition} from '../common'

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
            case 'eq':
            case 'not_eq':
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
            case 'contains':
            case 'not_contains':
            case 'containsInsensitive':
            case 'not_containsInsensitive':
            case 'startsWith':
            case 'not_startsWith':
            case 'endsWith':
            case 'not_endsWith':
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
