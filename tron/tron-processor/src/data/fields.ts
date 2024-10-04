import {DEFAULT_FIELDS, FieldSelection} from './model'
import {Selector} from './util'


/**
 * Get effective set of selected fields.
 */
export function getFields(fields: FieldSelection | undefined): FieldSelection {
    return {
        block: merge(DEFAULT_FIELDS.block, fields?.block),
        transaction: merge(DEFAULT_FIELDS.transaction, fields?.transaction),
        log: merge(DEFAULT_FIELDS.log, fields?.log),
        internalTransaction: merge(DEFAULT_FIELDS.internalTransaction, fields?.internalTransaction),
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
