import {Column} from './Column'
import {ColumnCommonOptions} from './common'
import { normalizedType } from '../../dialects';

export type BooleanColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

/**
 * BooleanColumn decorator is used to mark a specific class property as a `bool` table column.
 * Column value is transformed to `boolean` type.
 */
export function BooleanColumn(options?: BooleanColumnOptions): PropertyDecorator {
    const { type, options: opts } = normalizedType('bool', options)

    return Column(type, opts)
}
