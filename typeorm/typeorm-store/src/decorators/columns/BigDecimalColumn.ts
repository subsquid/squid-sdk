import {bigdecimalTransformer} from '../../transformers'
import {Column} from './Column'
import {ColumnCommonOptions} from './common'
import { normalizedType } from '../../dialects';

export type BigDecimalColumnOptions = Pick<ColumnCommonOptions, 'name' | 'unique' | 'nullable' | 'default' | 'comment'>

/**
 * BigDecimalColumn decorator is used to mark a specific class property as a `numeric` table column.
 * Column value is transformed to `BigDecimal` type.
 * 
 * Arrays are not supported.
 */
export function BigDecimalColumn(options?: BigDecimalColumnOptions): PropertyDecorator {
    const { type, options: opts } = normalizedType('numeric', {
        ...options,
        transformer: bigdecimalTransformer
    })

    return Column(type, opts)
}
