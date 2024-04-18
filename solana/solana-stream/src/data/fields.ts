import {DEFAULT_FIELDS, FieldSelection} from './model'
import {Selector} from './type-util'


/**
 * Get effective set of selected fields.
 */
export function getFields(fields: FieldSelection | undefined): FieldSelection {
    return {
        block: merge(DEFAULT_FIELDS.block, fields?.block),
        transaction: merge(DEFAULT_FIELDS.transaction, fields?.transaction),
        instruction: merge(DEFAULT_FIELDS.instruction, fields?.instruction),
        log: merge(DEFAULT_FIELDS.log, fields?.log),
        balance: merge(DEFAULT_FIELDS.balance, fields?.balance),
        tokenBalance: merge(DEFAULT_FIELDS.tokenBalance, fields?.tokenBalance),
        reward: merge(DEFAULT_FIELDS.reward, fields?.reward)
    }
}


function merge<Keys extends string>(def: Selector<Keys>, requested: Selector<Keys> = {}): Selector<Keys> {
    let fields: Selector<Keys> = {}

    for (let key in def) {
        if (requested[key] !== false) {
            fields[key] = def[key]
        }
    }

    for (let key in requested) {
        if (requested[key]) {
            fields[key] = true
        }
    }

    return fields
}


export function project<T>(fields: Selector<keyof T> | undefined, obj: T): Partial<T> {
    if (fields == null) return {}
    let result: Partial<T> = {}
    let key: keyof T
    for (key in obj) {
        if (fields[key]) {
            result[key] = obj[key]
        }
    }
    return result
}
