import {DEFAULT_FIELDS, FieldSelection} from './interfaces/data'
import {Selector} from './interfaces/util'


/**
 * Get effective set of selected fields.
 */
export function getFields(fields: FieldSelection | undefined): FieldSelection {
    return {
        block: merge(DEFAULT_FIELDS.block, fields?.block),
        transaction: merge(DEFAULT_FIELDS.transaction, fields?.transaction),
        receipt: merge(DEFAULT_FIELDS.receipt, fields?.receipt),
        input: merge(DEFAULT_FIELDS.input, fields?.input),
        output: merge(DEFAULT_FIELDS.output, fields?.output),
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
