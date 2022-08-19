import {unexpectedCase} from "@subsquid/util-internal"
import assert from "assert"
import {Where} from "../ir/args"
import {ensureArray} from "../util/util"


export function parseWhere(whereArg?: any): Where | undefined {
    if (whereArg == null) return undefined
    let {AND, OR, ...fields} = whereArg
    let conj: Where[] = []

    for (let key in fields) {
        let arg = fields[key]
        let {field, op} = parseWhereKey(key)
        switch(op) {
            case "REF":
            case "every": {
                let where = parseWhere(arg)
                where && conj.push({op, field, where})
                break
            }
            case "some":
            case "none":
                conj.push({op, field, where: parseWhere(arg)})
                break
            case "in":
            case "not_in":
                conj.push({op, field, values: ensureArray(arg)})
                break
            case "eq":
            case "not_eq":
            case "gt":
            case "gte":
            case "lt":
            case "lte":
            case "contains":
            case "not_contains":
            case "containsInsensitive":
            case "not_containsInsensitive":
            case "startsWith":
            case "not_startsWith":
            case "endsWith":
            case "not_endsWith":
            case "jsonHasKey":
            case "jsonContains":
                conj.push({op, field, value: arg})
                break
            case "containsNone":
            case "containsAll":
            case "containsAny":
                conj.push({op, field, value: ensureArray(arg)})
                break
            case "isNull":
                assert(typeof arg == 'boolean')
                conj.push({op, field, yes: arg})
                break
            default:
                throw unexpectedCase(op)
        }
    }

    if (AND) {
        for (let arg of ensureArray(AND)) {
            let where = parseWhere(arg)
            if (where) {
                conj.push(where)
            }
        }
    }

    let conjunction = toCondition('AND', conj)
    if (OR) {
        let disjunctions: Where[] = []
        if (conjunction) {
            disjunctions.push(conjunction)
        }
        for (let arg of ensureArray(OR)) {
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


function toCondition(op: 'AND' | 'OR', operands: Where[]): Where | undefined {
    switch(operands.length) {
        case 0:
            return undefined
        case 1:
            return operands[0]
        default:
            return {op, args: operands}
    }
}


export function parseWhereKey(key: string): {op: Where['op'], field: string} {
    let m = WHERE_KEY_REGEX.exec(key)
    if (m) {
        return {op: m[2] as Where['op'], field: m[1]}
    } else {
        return {op: 'REF', field: key}
    }
}


const WHERE_KEY_REGEX = (() => {
    let ops: Where['op'][] = [
        "eq",
        "not_eq",
        "gt",
        "gte",
        "lt",
        "lte",
        "contains",
        "not_contains",
        "containsInsensitive",
        "not_containsInsensitive",
        "startsWith",
        "not_startsWith",
        "endsWith",
        "not_endsWith",
        "containsAll",
        "containsAny",
        "containsNone",
        "jsonContains",
        "jsonHasKey",
        "isNull",
        "some",
        "every",
        "none",
        "in",
        "not_in",
    ]
    return new RegExp(`^([^_]*)_(${ops.join('|')})$`)
})()
