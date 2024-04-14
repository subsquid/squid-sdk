import {ValueTransformer} from 'typeorm'

/**
 * Types are restricted only to types listed in
 * https://orkhan.gitbook.io/typeorm/docs/entities#column-types-for-postgres
 */

/**
 * Column types used for @PrimaryGeneratedColumn() decorator.
 */
export type PrimaryGeneratedColumnType =
    | 'int'
    | 'int2'
    | 'int4'
    | 'int8'
    | 'integer'
    | 'smallint'
    | 'bigint'
    | 'decimal'
    | 'numeric'
/**
 * Column types where spatial properties are used.
 */
export type SpatialColumnType = 'geometry' | 'geography'
/**
 * Column types where precision and scale properties are used.
 */
export type WithPrecisionColumnType =
    | 'float'
    | 'decimal'
    | 'numeric'
    | 'real'
    | 'double precision'
    | 'time'
    | 'time with time zone'
    | 'time without time zone'
    | 'timestamp'
    | 'timestamp without time zone'
    | 'timestamp with time zone'
/**
 * Column types where column length is used.
 */
export type WithLengthColumnType = 'character varying' | 'character' | 'varchar' | 'char'
export type WithWidthColumnType = 'smallint' | 'int' | 'bigint'
/**
 * All other regular column types.
 */
export type SimpleColumnType =
    | 'int2'
    | 'integer'
    | 'int4'
    | 'int8'
    | 'float'
    | 'float4'
    | 'float8'
    | 'money'
    | 'boolean'
    | 'bool'
    | 'text'
    | 'citext'
    | 'hstore'
    | 'bytea'
    | 'timetz'
    | 'timestamptz'
    | 'date'
    | 'interval'
    | 'point'
    | 'line'
    | 'lseg'
    | 'box'
    | 'circle'
    | 'path'
    | 'polygon'
    | 'geography'
    | 'geometry'
    | 'int4range'
    | 'int8range'
    | 'numrange'
    | 'tsrange'
    | 'tstzrange'
    | 'daterange'
    | 'enum'
    | 'cidr'
    | 'inet'
    | 'macaddr'
    | 'bit'
    | 'bit varying'
    | 'varbit'
    | 'tsvector'
    | 'tsquery'
    | 'uuid'
    | 'xml'
    | 'json'
    | 'jsonb'
    | 'cube'
    | 'ltree'
/**
 * Any column type column can be.
 */
export type ColumnType =
    | WithPrecisionColumnType
    | WithLengthColumnType
    | WithWidthColumnType
    | SpatialColumnType
    | SimpleColumnType
    | BooleanConstructor
    | DateConstructor
    | NumberConstructor
    | StringConstructor

export interface ColumnCommonOptions {
    /**
     * Column name in the database.
     */
    name?: string
    /**
     * Specifies if column's value must be unique or not.
     */
    unique?: boolean
    /**
     * Indicates if column's value can be set to NULL.
     */
    nullable?: boolean
    /**
     * Default database value.
     */
    default?: any
    /**
     * Column comment. Not supported by all database types.
     */
    comment?: string
    /**
     * Indicates if this column is an array.
     * Can be simply set to true or array length can be specified.
     * Supported only by postgres.
     */
    array?: boolean
    /**
     * Specifies a value transformer that is to be used to (un)marshal
     * this column when reading or writing to the database.
     */
    transformer?: ValueTransformer | ValueTransformer[]
}

/**
 * Options for numeric column types where user can specify scale and precision.
 */
export interface ColumnNumericOptions {
    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    precision?: number
    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    scale?: number
}

/**
 * Options for columns that can define a length of the column type.
 */
export interface ColumnWithLengthOptions {
    /**
     * Column type's length.
     * For example type = "varchar" and length = "100" means ORM will create a column with type varchar(100).
     */
    length?: string | number
}

export interface ColumnOptions extends ColumnCommonOptions {
    /**
     * Column type. Must be one of the value from the ColumnTypes class.
     */
    type?: ColumnType
    /**
     * Column name in the database.
     */
    name?: string
    /**
     * Column type's length. Used only on some column types.
     * For example type = "string" and length = "100" means that ORM will create a column with type varchar(100).
     */
    length?: string | number
    /**
     * Indicates if column's value can be set to NULL.
     * Default value is "false".
     */
    nullable?: boolean
    /**
     * Default database value.
     */
    default?: any
    /**
     * Indicates if this column is a primary key.
     * Same can be achieved when @PrimaryColumn decorator is used.
     */
    primary?: boolean
    /**
     * Specifies if column's value must be unique or not.
     */
    unique?: boolean
    /**
     * Column comment. Not supported by all database types.
     */
    comment?: string
    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    precision?: number | null
    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    scale?: number
    /**
     * Array of possible enumerated values.
     */
    enum?: (string | number)[] | Object
    /**
     * Exact name of enum
     */
    enumName?: string
    /**
     * If this column is primary key then this specifies the name for it.
     */
    primaryKeyConstraintName?: string
    /**
     * If this column is foreign key then this specifies the name for it.
     */
    foreignKeyConstraintName?: string
    /**
     * Indicates if this column is an array.
     * Can be simply set to true or array length can be specified.
     * Supported only by postgres.
     */
    array?: boolean
    /**
     * Specifies a value transformer that is to be used to (un)marshal
     * this column when reading or writing to the database.
     */
    transformer?: ValueTransformer | ValueTransformer[]
}
