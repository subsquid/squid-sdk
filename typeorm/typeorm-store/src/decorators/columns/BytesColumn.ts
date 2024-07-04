import {Column} from './Column'
import {ColumnCommonOptions} from './common'
import { normalizedType } from '../../dialects';

export type BytesColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

/**
 * BytesColumn decorator is used to mark a specific class property as a `bytea` table column.
 * Column value is transformed to `Uint8Array` type.
 */
export function BytesColumn(options?: BytesColumnOptions): PropertyDecorator {
    const { type, options: opts} = normalizedType('bytea', options)

    return Column(type, opts)
}
