import {Column as _Column} from 'typeorm'
import {SimpleColumnType, WithLengthColumnType, WithPrecisionColumnType} from 'typeorm/driver/types/ColumnTypes'
import {ColumnCommonOptions, ColumnNumericOptions, ColumnOptions, ColumnType, ColumnWithLengthOptions} from './common'

/**
 * Column decorator is used to mark a specific class property as a table column. Only properties decorated with this
 * decorator will be persisted to the database when entity be saved.
 */
export function Column(): PropertyDecorator

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(type: SimpleColumnType, options?: ColumnCommonOptions): PropertyDecorator

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(
    type: WithLengthColumnType,
    options?: ColumnCommonOptions & ColumnWithLengthOptions
): PropertyDecorator

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(
    type: WithPrecisionColumnType,
    options?: ColumnCommonOptions & ColumnNumericOptions
): PropertyDecorator

/**
 * Column decorator is used to mark a specific class property as a table column.
 * Only properties decorated with this decorator will be persisted to the database when entity be saved.
 */
export function Column(
    typeOrOptions?: ((type?: any) => Function) | ColumnType | ColumnOptions,
    options?: ColumnOptions
): PropertyDecorator {
    return _Column(typeOrOptions as any, options)
}
