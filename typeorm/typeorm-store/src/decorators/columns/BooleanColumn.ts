import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type BooleanColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

export function BooleanColumn(options?: BooleanColumnOptions): PropertyDecorator {
    return Column('bool', options)
}
