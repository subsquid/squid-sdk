import {createConnectionOptions} from '../connectionOptions'
import {toPgClientConfig} from '../pg'
import {clearDbEnv, restoreDbEnv, snapshotDbEnv} from './util'


// Feature: a configurable data schema, threaded as a connection-level
// `search_path` (pg `-c search_path=...`). Default is the schema alone; the
// `,public` tail is opt-in via DB_SCHEMA_INCLUDE_PUBLIC.
describe('DB_SCHEMA -> connection search_path', () => {
    let saved: Record<string, string | undefined>

    beforeEach(() => {
        saved = snapshotDbEnv()
        clearDbEnv()
    })

    afterEach(() => {
        restoreDbEnv(saved)
    })

    test('unset: no search_path options are added (unchanged)', () => {
        process.env.DB_HOST = 'db.example'
        const con = createConnectionOptions() as unknown as Record<string, any>
        expect(con.extra).toBeUndefined()
        expect((toPgClientConfig(createConnectionOptions()) as unknown as Record<string, any>).options).toBeUndefined()
    })

    test('DB_SCHEMA sets search_path=<schema> (schema only) on TypeORM `extra` and pg `options`', () => {
        process.env.DB_SCHEMA = 'eth_v3'
        const con = createConnectionOptions() as unknown as Record<string, any>
        expect(con.extra).toEqual({options: '-c search_path="eth_v3"'})
        expect((toPgClientConfig(con as any) as unknown as Record<string, any>).options).toBe('-c search_path="eth_v3"')
    })

    test('DB_SCHEMA_INCLUDE_PUBLIC=true appends ,public', () => {
        process.env.DB_SCHEMA = 'eth_v3'
        process.env.DB_SCHEMA_INCLUDE_PUBLIC = 'true'
        const con = createConnectionOptions() as unknown as Record<string, any>
        expect(con.extra).toEqual({options: '-c search_path="eth_v3",public'})
    })

    test('applies to DB_URL connections as well', () => {
        process.env.DB_URL = 'postgres://u:p@h:5432/db'
        process.env.DB_SCHEMA = 'eth_v3'
        const con = createConnectionOptions() as unknown as Record<string, any>
        expect(con.extra).toEqual({options: '-c search_path="eth_v3"'})
        expect((toPgClientConfig(con as any) as unknown as Record<string, any>).options).toBe('-c search_path="eth_v3"')
    })

    test('rejects an invalid DB_SCHEMA (injection guard)', () => {
        process.env.DB_SCHEMA = 'evil; drop schema public'
        expect(() => createConnectionOptions()).toThrow(/DB_SCHEMA/)
    })

    test('toPgClientConfig never leaks TypeORM `extra` into the pg client config', () => {
        process.env.DB_SCHEMA = 'eth_v3'
        const pg = toPgClientConfig(createConnectionOptions()) as unknown as Record<string, any>
        expect(pg.extra).toBeUndefined()
        expect(pg.options).toBe('-c search_path="eth_v3"')
    })
})
