/// <reference types="vitest/globals" />
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


/**
 * The DB_* env vars that select a connection. Tests that exercise
 * `createConnectionOptions()` mutate these, so they save/restore around each case.
 */
export const DB_ENV_VARS = [
    'DB_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS',
    'DB_SSL', 'DB_SSL_CA', 'DB_SSL_CA_FILE', 'DB_SSL_CERT', 'DB_SSL_CERT_FILE',
    'DB_SSL_KEY', 'DB_SSL_KEY_FILE', 'DB_SSL_REJECT_UNAUTHORIZED',
]


export function clearDbEnv(): void {
    for (let k of DB_ENV_VARS) {
        delete process.env[k]
    }
}


export function snapshotDbEnv(): Record<string, string | undefined> {
    let snap: Record<string, string | undefined> = {}
    for (let k of DB_ENV_VARS) {
        snap[k] = process.env[k]
    }
    return snap
}


export function restoreDbEnv(snap: Record<string, string | undefined>): void {
    for (let k of DB_ENV_VARS) {
        let v = snap[k]
        if (v === undefined) {
            delete process.env[k]
        } else {
            process.env[k] = v
        }
    }
}
