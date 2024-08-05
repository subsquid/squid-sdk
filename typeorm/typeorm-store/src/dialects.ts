import { getDbType } from '@subsquid/typeorm-config';
import { ColumnType, SimpleColumnType, WithPrecisionColumnType } from 'typeorm/driver/types/ColumnTypes';
import { ColumnCommonOptions,  } from 'typeorm/decorator/options/ColumnCommonOptions';
import { ColumnNumericOptions } from 'typeorm/decorator/options/ColumnNumericOptions';
import { sqliteIntArrayTransformer } from './transformers';

const dbType = getDbType()

export function tableName(table: string, schema: string): string {
    if(getDbType() === 'sqlite') return `"__${table}"`

    return `${schema}.${table}`
}

export function paramName(index: number) {
    if(dbType === 'sqlite') return `?`

    return `$${index}`
}

export function normalizedType(type: SimpleColumnType, options?: ColumnCommonOptions): { type: SimpleColumnType, options?: ColumnCommonOptions & ColumnNumericOptions }
export function normalizedType(type: WithPrecisionColumnType, options?: ColumnCommonOptions): { type: WithPrecisionColumnType, options?: ColumnCommonOptions }
export function normalizedType(type: ColumnType , options?: ColumnCommonOptions): { type: ColumnType, options?: ColumnCommonOptions } {
    switch (dbType) {
        case 'sqlite':
            switch (type) {
                case 'bool':
                    return {type: 'boolean', options};
                case 'json':
                case 'jsonb':
                    return {type: 'simple-json', options};
                case 'bytea':
                    return {type: 'blob', options};
                case 'numeric':
                    if (options?.array) {
                        return {
                            type: 'simple-array',
                            options: {
                                ...options,
                                transformer: sqliteIntArrayTransformer
                            }
                        };
                    }

                    return {type: 'text', options};
                case 'int4':
                    if (options?.array) {
                        return {
                            type: 'simple-array',
                            options: {
                                ...options,
                                transformer: sqliteIntArrayTransformer
                            }
                        };
                    }

                    return {type: 'integer', options};
                case 'timestamp with time zone':
                    return {type: 'datetime', options};
                default:
                    if (options?.array) return {type: 'simple-array', options};

                    return {type, options};
            }
        default:
            return {type, options};
    }
}