import {bigintTransformer} from '../../transformers'
import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type BigIntColumnOptions = Pick<ColumnCommonOptions, 'name' | 'unique' | 'nullable' | 'default' | 'comment'>

/**
 * BigIntColumn decorator is used to mark a specific class property as a `numeric` table column.
 * Column value is transformed to `bigint` type.
 * 
 * Arrays are not supported.
 */
export function BigIntColumn(options?: BigIntColumnOptions): PropertyDecorator {
    return Column('numeric', {...options, transformer: bigintTransformer})
}
