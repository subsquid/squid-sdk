import assert from 'assert'
import {PrimaryColumn as _PrimaryColumn} from 'typeorm'

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 * Primary columns also creates a PRIMARY KEY for this column in a db.
 *
 * Only `id` property can be used as a primary column
 */
export function PrimaryColumn(): PropertyDecorator {
    return function (object: Object, propertyName: string | symbol) {
        assert(propertyName === 'id', 'only "id" field can be used as a primary column')
        _PrimaryColumn()(object, propertyName)
    }
}
