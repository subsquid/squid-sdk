import * as fs from "fs"
import * as path from "path"
import {ConnectionOptions as OrmConfig} from "typeorm"
import {SnakeNamingStrategy} from "./namingStrategy"


export interface ConnectionOptions {
    host: string
    port: number
    database: string
    username: string
    password: string
}


export function createConnectionOptions(): ConnectionOptions {
    return {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        database: process.env.DB_NAME || 'postgres',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres'
    }
}


export interface OrmOptions {
    /**
     * CommonJS module with typeorm entity classes
     *
     * @default lib/generated/model.js
     */
    model?: string
    /**
     * A directory with migrations.
     *
     * Every direct child .js file is treated as a migration.
     *
     * @default db/migrations
     */
    migrationsDir?: string
}


export function createOrmConfig(options?: OrmOptions): OrmConfig {
    let model = resolveModel(options?.model)
    let migrationsDir = path.resolve(options?.migrationsDir || 'db/migrations')
    return {
        type: 'postgres',
        namingStrategy: new SnakeNamingStrategy(),
        entities: [model],
        migrations: [migrationsDir + '/*.js'],
        cli: {
            migrationsDir
        },
        ...createConnectionOptions()
    }
}


function resolveModel(model?: string): string {
    model = model || 'lib/generated/model.js'
    if (fs.existsSync(model)) return path.resolve(model)
    throw new Error(
        `Failed to locate model at ${model}. Did you forget to run codegen or compile the code?`
    )
}
