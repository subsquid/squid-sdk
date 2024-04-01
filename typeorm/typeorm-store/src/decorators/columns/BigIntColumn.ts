import {bigintTransformer} from '../../transformers'
import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type BigIntColumnOptions = Pick<ColumnCommonOptions, 'name' | 'unique' | 'nullable' | 'default' | 'comment'>

export function BigIntColumn(options?: BigIntColumnOptions): PropertyDecorator {
    return Column('numeric', {...options, transformer: bigintTransformer})
}
