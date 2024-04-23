import {OrderByCondition, Entity as _Entity} from 'typeorm'

export interface EntityOptions {
    /**
     * Table name.
     * If not specified then naming strategy will generate table name from entity name.
     */
    name?: string
    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     */
    orderBy?: OrderByCondition | ((object: any) => OrderByCondition | any)
    /**
     * Schema name.
     */
    schema?: string
}

/**
 * This decorator is used to mark classes that will be an entity.
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
export function Entity(options?: EntityOptions): ClassDecorator

/**
 * This decorator is used to mark classes that will be an entity (table or document depend on database type).
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
export function Entity(name?: string, options?: EntityOptions): ClassDecorator

/**
 * This decorator is used to mark classes that will be an entity (table or document depend on database type).
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
export function Entity(nameOrOptions?: string | EntityOptions, maybeOptions?: EntityOptions): ClassDecorator {
    return _Entity(nameOrOptions as any, maybeOptions)
}
