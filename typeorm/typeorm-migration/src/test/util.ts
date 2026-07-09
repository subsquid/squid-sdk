/// <reference types="vitest/globals" />
import {execFileSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import {Client as PgClient, ClientBase} from 'pg'


export const db_config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'postgres',
}


export async function withClient(block: (client: ClientBase) => Promise<void>): Promise<void> {
    let client = new PgClient(db_config)
    await client.connect()
    try {
        await block(client)
    } finally {
        await client.end()
    }
}


// A compiled squid model, mirroring what squid-typeorm-codegen emits:
// schema-neutral `@Entity` (here an EntitySchema) with enum fields represented
// as `varchar` — never a native Postgres enum type.
export const ACCOUNT_MODEL = `
const {EntitySchema} = require('typeorm')

const Account = new EntitySchema({
    name: 'Account',
    columns: {
        id: {type: 'varchar', primary: true},
        status: {type: 'varchar', length: 16},
        balance: {type: 'int'},
        data: {type: 'jsonb', nullable: true},
    },
})

module.exports = {Account}
`


export const SCHEMA_ENV_VARS = ['DB_SCHEMA', 'DB_SCHEMA_INCLUDE_PUBLIC']


/**
 * Registers hooks that clear the schema env vars before each test and restore
 * them after, leaving the connection vars (`DB_HOST`/`DB_PORT`/...) intact. The
 * CLIs inherit `process.env`, so this keeps an ambient `DB_SCHEMA` in the shell
 * or CI from redirecting them to a non-default schema and flaking the
 * default-behavior assertions.
 */
export function isolateSchemaEnv(): void {
    let saved: Record<string, string | undefined>
    beforeEach(() => {
        saved = {}
        for (let k of SCHEMA_ENV_VARS) {
            saved[k] = process.env[k]
            delete process.env[k]
        }
    })
    afterEach(() => {
        for (let k of SCHEMA_ENV_VARS) {
            let v = saved[k]
            if (v === undefined) {
                delete process.env[k]
            } else {
                process.env[k] = v
            }
        }
    })
}


/** Schemas in which a given (unqualified) table currently exists. */
export async function tableSchemas(table: string): Promise<string[]> {
    let schemas: string[] = []
    await withClient(async client => {
        let res = await client.query(
            `SELECT schemaname FROM pg_tables WHERE tablename = $1 ORDER BY schemaname`,
            [table]
        )
        schemas = res.rows.map((r: any) => r.schemaname)
    })
    return schemas
}


// The compiled CLI entrypoints live next to this file's parent (lib/), e.g.
// lib/generate.js. __dirname at runtime is <pkg>/lib/test.
const LIB_DIR = path.resolve(__dirname, '..')


/**
 * A throwaway squid project dir (under the package tree, so Node resolves
 * `typeorm` for the model) with a compiled `lib/model` and an empty
 * `db/migrations`. The CLIs are run with this as their cwd.
 */
export class FixtureProject {
    constructor(readonly dir: string) {}

    static create(dir: string, modelSource: string): FixtureProject {
        fs.rmSync(dir, {recursive: true, force: true})
        fs.mkdirSync(path.join(dir, 'lib', 'model'), {recursive: true})
        fs.mkdirSync(path.join(dir, 'db', 'migrations'), {recursive: true})
        fs.writeFileSync(path.join(dir, 'lib', 'model', 'index.js'), modelSource)
        return new FixtureProject(dir)
    }

    private run(script: string): string {
        return execFileSync('node', [path.join(LIB_DIR, script)], {
            cwd: this.dir,
            env: process.env,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        })
    }

    generate(): string {
        return this.run('generate.js')
    }

    apply(): string {
        return this.run('apply.js')
    }

    revert(): string {
        return this.run('revert.js')
    }

    migrationFiles(): string[] {
        let dir = path.join(this.dir, 'db', 'migrations')
        return fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()
    }

    readMigration(file: string): string {
        return fs.readFileSync(path.join(this.dir, 'db', 'migrations', file), 'utf8')
    }

    destroy(): void {
        fs.rmSync(this.dir, {recursive: true, force: true})
    }
}
