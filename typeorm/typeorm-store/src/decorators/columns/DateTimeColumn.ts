import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type DateTimeColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

/**
 * DateTimeColumn decorator is used to mark a specific class property as a `timestamp with time zone` table column.
 * Column value is transformed to `Date` type.
 */
export function DateTimeColumn(options?: DateTimeColumnOptions): PropertyDecorator {
    return Column('timestamp with time zone', options)
}
