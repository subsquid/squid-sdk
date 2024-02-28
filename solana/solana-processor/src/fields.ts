import {DEFAULT_FIELDS, FieldSelection} from './interfaces/data'


/**
 * Get effective set of selected fields for archive query.
 *
 * Includes fields that are configurable on archive side, but not on the processor side.
 * Those fields are not part of `FieldSelection`.
 */
export function getFields(fields: FieldSelection | undefined): FieldSelection {
    return {
        block: merge(DEFAULT_FIELDS.block, fields?.block, {
            parentHash: true
        }),
        transaction: merge(DEFAULT_FIELDS.transaction, fields?.transaction),
        instruction: merge(DEFAULT_FIELDS.instruction, fields?.instruction),
        log: merge(DEFAULT_FIELDS.log, fields?.log, {
            instructionAddress: true
        }),
        balance: merge(DEFAULT_FIELDS.balance, fields?.balance),
        tokenBalance: merge(DEFAULT_FIELDS.tokenBalance, fields?.tokenBalance),
        reward: merge(DEFAULT_FIELDS.reward, fields?.reward)
    }
}


type Sel<Keys extends string> = {
    [K in Keys]?: boolean
}


function merge<Keys extends string>(def: Sel<Keys>, requested?: Sel<Keys>, required?: Sel<Keys>): Sel<Keys> {
    let fields: Sel<Keys> = {
        ...required,
        ...def
    }

    for (let key in requested) {
        if (requested[key]) {
            fields[key] = true
        } else if (fields[key] === false && !required?.[key]) {
            delete fields[key]
        }
    }

    return fields
}
