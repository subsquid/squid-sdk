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
