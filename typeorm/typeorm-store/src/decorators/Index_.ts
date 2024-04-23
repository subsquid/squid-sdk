import {Index as _Index} from 'typeorm'

export interface IndexOptions {
    /**
     * Indicates if this composite index must be unique or not.
     */
    unique?: boolean
    /**
     * Index filter condition.
     */
    where?: string
}

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(options?: IndexOptions): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(name: string, options?: IndexOptions): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(name: string, options: {synchronize: false}): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(name: string, fields: string[], options?: IndexOptions): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(fields: string[], options?: IndexOptions): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(
    fields: (object?: any) => any[] | {[key: string]: number},
    options?: IndexOptions
): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(
    name: string,
    fields: (object?: any) => any[] | {[key: string]: number},
    options?: IndexOptions
): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(
    nameOrFieldsOrOptions?: string | string[] | ((object: any) => any[] | {[key: string]: number}) | IndexOptions,
    maybeFieldsOrOptions?:
        | ((object?: any) => any[] | {[key: string]: number})
        | IndexOptions
        | string[]
        | {synchronize: false},
    maybeOptions?: IndexOptions
): ClassDecorator & PropertyDecorator {
    return _Index(nameOrFieldsOrOptions as any, maybeFieldsOrOptions as any, maybeOptions)
}
