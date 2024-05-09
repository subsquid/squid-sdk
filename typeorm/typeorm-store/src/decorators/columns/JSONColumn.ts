import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type JSONColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

/**
 * JSONColumn decorator is used to mark a specific class property as a `jsonb` table column.
 * Column value is transformed to `unknown` type.
 */
export function JSONColumn(options?: JSONColumnOptions): PropertyDecorator {
    return Column('jsonb', options)
}
