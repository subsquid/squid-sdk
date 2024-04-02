import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type BytesColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

/**
 * BytesColumn decorator is used to mark a specific class property as a `bytea` table column.
 * Column value is transformed to `Uint8Array` type.
 */
export function BytesColumn(options?: BytesColumnOptions): PropertyDecorator {
    return Column('bytea', options)
}
