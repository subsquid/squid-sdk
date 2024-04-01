import {floatTransformer} from '../../transformers'
import {Column} from './Column'
import {ColumnCommonOptions} from './common'

export type FloatColumnOptions = Pick<ColumnCommonOptions, 'name' | 'unique' | 'nullable' | 'default' | 'comment'>

export function FloatColumn(options?: FloatColumnOptions): PropertyDecorator {
    return Column('numeric', {...options, transformer: floatTransformer})
}
