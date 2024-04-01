import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type DateTimeColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

export function DateTimeColumn(options?: DateTimeColumnOptions): PropertyDecorator {
    return Column('timestamp with time zone', options)
}
