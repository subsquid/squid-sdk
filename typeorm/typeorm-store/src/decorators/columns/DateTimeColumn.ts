import { Column } from './Column';
import { ColumnCommonOptions } from './common';
import { normalizedType } from '../../dialects';
import { getDbType } from '@subsquid/typeorm-config';

export type DateTimeColumnOptions = Pick<
    ColumnCommonOptions,
    'name' | 'unique' | 'nullable' | 'default' | 'comment' | 'array'
>

/**
 * DateTimeColumn decorator is used to mark a specific class property as a `timestamp with time zone` table column.
 * Column value is transformed to `Date` type.
 */
export function DateTimeColumn(options?: DateTimeColumnOptions): PropertyDecorator {
    const { type, options: opts } = normalizedType('timestamp with time zone', options)

    return Column(type, opts)
}

