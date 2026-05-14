import {FieldSelection} from './data/model'


/**
 * Get effective set of selected fields.
 */
export function getFields(fields: FieldSelection | undefined): FieldSelection {
    return fields ?? {}
}
