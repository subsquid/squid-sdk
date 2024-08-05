import {floatTransformer} from '../../transformers'
import {Column} from './Column'
import {ColumnCommonOptions} from './common'
import { normalizedType } from '../../dialects';

export type FloatColumnOptions = Pick<ColumnCommonOptions, 'name' | 'unique' | 'nullable' | 'default' | 'comment'>

/**
 * FloatColumn decorator is used to mark a specific class property as a `numeric` table column.
 * Column value is transformed to `number` type.
 * 
 * Arrays are not supported.
 */
export function FloatColumn(options?: FloatColumnOptions): PropertyDecorator {
    const  { type, options: opts } = normalizedType('numeric',  {
        ...options,
        transformer: floatTransformer
    })

    return Column(type, opts)
}
