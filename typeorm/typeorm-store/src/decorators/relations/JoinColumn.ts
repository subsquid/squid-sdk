import {JoinColumn as _JoinColumn} from 'typeorm'

export interface JoinColumnOptions {
    /**
     * Name of the column.
     */
    name?: string
    /**
     * Name of the column in the entity to which this column is referenced.
     */
    referencedColumnName?: string
    /**
     * Name of the foreign key constraint.
     */
    foreignKeyConstraintName?: string
}

/**
 * JoinColumn decorator used on one-to-one relations to specify owner side of relationship.
 * It also can be used on both one-to-one and many-to-one relations to specify custom column name
 * or custom referenced column.
 */
export function JoinColumn(): PropertyDecorator

/**
 * JoinColumn decorator used on one-to-one relations to specify owner side of relationship.
 * It also can be used on both one-to-one and many-to-one relations to specify custom column name
 * or custom referenced column.
 */
export function JoinColumn(options: JoinColumnOptions): PropertyDecorator

/**
 * JoinColumn decorator used on one-to-one relations to specify owner side of relationship.
 * It also can be used on both one-to-one and many-to-one relations to specify custom column name
 * or custom referenced column.
 */
export function JoinColumn(options: JoinColumnOptions[]): PropertyDecorator

/**
 * JoinColumn decorator used on one-to-one relations to specify owner side of relationship.
 * It also can be used on both one-to-one and many-to-one relations to specify custom column name
 * or custom referenced column.
 */
export function JoinColumn(optionsOrOptionsArray?: JoinColumnOptions | JoinColumnOptions[]): PropertyDecorator {
    return _JoinColumn(optionsOrOptionsArray as any)
}
