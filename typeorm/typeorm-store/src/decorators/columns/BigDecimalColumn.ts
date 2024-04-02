import {bigdecimalTransformer} from '../../transformers'
import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type BigDecimalColumnOptions = Pick<ColumnCommonOptions, 'name' | 'unique' | 'nullable' | 'default' | 'comment'>

/**
 * BigDecimalColumn decorator is used to mark a specific class property as a `numeric` table column.
 * Column value is transformed to `BigDecimal` type.
 * 
 * Arrays are not supported.
 */
export function BigDecimalColumn(options?: BigDecimalColumnOptions): PropertyDecorator {
    return Column('numeric', {...options, transformer: bigdecimalTransformer})
}
