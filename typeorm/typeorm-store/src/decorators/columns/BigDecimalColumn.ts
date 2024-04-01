import {bigdecimalTransformer} from '../../transformers'
import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type BigDecimalColumnOptions = Pick<ColumnCommonOptions, 'name' | 'unique' | 'nullable' | 'default' | 'comment'>

export function BigDecimalColumn(options?: BigDecimalColumnOptions): PropertyDecorator {
    return Column('numeric', {...options, transformer: bigdecimalTransformer})
}
