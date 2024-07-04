import {Column} from './Column'
import {ColumnCommonOptions} from './common'
import { normalizedType } from '../../dialects';

export type StringColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

/**
 * StringColumn decorator is used to mark a specific class property as a `text` table column.
 * Column value is transformed to `string` type.
 */
export function StringColumn(options?: StringColumnOptions): PropertyDecorator {
    const { type, options: opts} = normalizedType('text', options)

    return Column(type, opts)
}
