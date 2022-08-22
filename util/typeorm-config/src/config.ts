import * as path from "path"
import * as process from "process"
import 'dotenv/config'
import type {DataSourceOptions as OrmConfig} from "typeorm"
import {SnakeNamingStrategy} from "./namingStrategy"
import {DatabaseType} from "typeorm/driver/types/DatabaseType";
import {MixedList} from "typeorm/common/MixedList";
import {EntitySchema} from "typeorm/entity-schema/EntitySchema";


export interface ConnectionOptions {
    host: string
    port: number
    database: string
    username: string
    password: string
}

export interface ConnectionOptionsPostgres {
    host: string
    port: number
    database: string
    username: string
    password: string
}
export interface ConnectionOptionsBSqlite3 {
    database: string
}

type ConnectionOptionsCombined = ConnectionOptionsPostgres | ConnectionOptionsBSqlite3 | {}


export function createConnectionOptions(rdbmsType: DatabaseType, customDbName?: string | null): ConnectionOptionsCombined {
    switch (rdbmsType) {
        case 'postgres':
            return {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
                database: customDbName || process.env.DB_NAME || 'postgres',
                username: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASS || 'postgres'
            }
        case 'better-sqlite3':
            return {
                database: customDbName
                    ? `db-sqlite/${customDbName}.db`
                    : `db-sqlite/${process.env.DB_NAME ? `${process.env.DB_NAME}.db` : 'squid.db'}`
            }
        default:
            return {}
    }

}


export interface OrmOptions {
    projectDir?: string
    rdbmsType?: DatabaseType
    customDbName?: string
    entities?: MixedList<Function | string | EntitySchema> | null
    migrations?: MixedList<Function | string> | null
}


export const MIGRATIONS_DIR = 'db/migrations'


export function createOrmConfig<T>(options?: OrmOptions): OrmConfig {
    let dir = path.resolve(options?.projectDir || process.cwd())
    let model = resolveModel(path.join(dir, 'lib/model'))
    let migrationsDir = path.join(dir, MIGRATIONS_DIR)
    let rdbmsType = options?.rdbmsType || 'postgres'
    let customDbName = options?.customDbName || null
    let entities = options?.entities || [model]
    let migrations = options?.migrations || [migrationsDir + '/*.js']

    // @ts-ignore TODO MUST be refactored
    let resultConfig: OrmConfig = {
        type: rdbmsType,
        namingStrategy: new SnakeNamingStrategy(),
        ...(options?.entities !== null && {entities: entities}),
        ...(options?.migrations !== null && {migrations: migrations}),
        ...createConnectionOptions(rdbmsType, customDbName)
    }

    return resultConfig;
}


function resolveModel(model?: string): string {
    model = path.resolve(model || 'lib/model')
    try {
        return require.resolve(model)
    } catch(e: any) {
        throw new Error(
            `Failed to resolve model ${model}. Did you forget to run codegen or compile the code?`
        )
    }
}
