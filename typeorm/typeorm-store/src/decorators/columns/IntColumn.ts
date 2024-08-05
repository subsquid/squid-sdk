import {Column} from './Column'
import {ColumnCommonOptions} from './common'
import { normalizedType } from '../../dialects';

export type IntColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

/**
 * IntColumn decorator is used to mark a specific class property as a `int4` table column.
 * Column value is transformed to `number` type.
 */
export function IntColumn(options?: IntColumnOptions): PropertyDecorator {
    const { type, options: opts} = normalizedType('int4', options)

    return Column(type, opts)
}
