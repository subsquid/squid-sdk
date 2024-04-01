import {Column} from './Column'
import {ColumnCommonOptions, ColumnOptions} from './common'

export type IntColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

export function IntColumn(options?: IntColumnOptions): PropertyDecorator {
    return Column('int4', options)
}
