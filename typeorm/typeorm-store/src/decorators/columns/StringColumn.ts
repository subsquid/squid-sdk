import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type StringColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

export function StringColumn(options?: StringColumnOptions): PropertyDecorator {
    return Column('text', options)
}
