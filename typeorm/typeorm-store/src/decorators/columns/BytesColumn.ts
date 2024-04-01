import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type BytesColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

export function BytesColumn(options?: BytesColumnOptions): PropertyDecorator {
    return Column('bytea', options)
}
