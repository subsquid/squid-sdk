import * as path from "path"
import * as process from "process"
import type {DataSourceOptions as OrmConfig} from "typeorm"
import {createConnectionOptions} from "./connectionOptions"
import {SnakeNamingStrategy} from "./namingStrategy"


export interface OrmOptions {
    projectDir?: string
}


export const MIGRATIONS_DIR = 'db/migrations'


export function createOrmConfig(options?: OrmOptions): OrmConfig {
    let dir = path.resolve(options?.projectDir || process.cwd())
    let model = resolveModel(path.join(dir, 'lib/model'))
    let migrationsDir = path.join(dir, MIGRATIONS_DIR)
    return {
        type: 'postgres',
        namingStrategy: new SnakeNamingStrategy(),
        entities: [model],
        migrations: [migrationsDir + '/*.js'],
        ...createConnectionOptions()
    }
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
