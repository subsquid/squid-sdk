import {createConnectionOptions} from '../connectionOptions'
import {toPgClientConfig} from '../pg'
import {clearDbEnv} from './util'


// Characterization tests: pin the CURRENT behavior of the connection-config
// builders. The upcoming `schema` / search_path feature changes exactly this
// surface, so the "baseline" cases below are the control that the feature flips.
describe('createConnectionOptions (current behavior)', () => {
    let saved: NodeJS.ProcessEnv

    beforeEach(() => {
        saved = {...process.env}
        clearDbEnv()
    })

    afterEach(() => {
        process.env = saved
    })

    test('parameter connection assembled from DB_* env vars', () => {
        process.env.DB_HOST = 'db.example'
        process.env.DB_PORT = '1234'
        process.env.DB_NAME = 'squid'
        process.env.DB_USER = 'alice'
        process.env.DB_PASS = 'secret'
        expect(createConnectionOptions()).toEqual({
            host: 'db.example',
            port: 1234,
            database: 'squid',
            username: 'alice',
            password: 'secret',
        })
    })

    test('defaults when nothing is set', () => {
        expect(createConnectionOptions()).toEqual({
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            username: 'postgres',
            password: 'postgres',
        })
    })

    test('DB_URL produces a url connection', () => {
        process.env.DB_URL = 'postgres://bob:pw@db.example:5432/squid'
        const con = createConnectionOptions()
        expect(con.url).toBe('postgres://bob:pw@db.example:5432/squid')
    })

    test('BASELINE: no search_path / extra options are set today', () => {
        process.env.DB_HOST = 'db.example'
        const con = createConnectionOptions() as unknown as Record<string, unknown>
        expect(con.extra).toBeUndefined()
        expect(con.schema).toBeUndefined()
    })
})


describe('toPgClientConfig (current behavior)', () => {
    test('maps username -> user for a parameter connection', () => {
        expect(toPgClientConfig({
            host: 'db.example',
            port: 1234,
            database: 'squid',
            username: 'alice',
            password: 'secret',
        })).toEqual({
            host: 'db.example',
            port: 1234,
            database: 'squid',
            user: 'alice',
            password: 'secret',
        })
    })

    test('passes a url through as connectionString', () => {
        expect(toPgClientConfig({url: 'postgres://x/squid'})).toEqual({
            connectionString: 'postgres://x/squid',
        })
    })

    test('BASELINE: no pg `options` (search_path) is set today', () => {
        const pg = toPgClientConfig({
            host: 'db.example',
            port: 1234,
            database: 'squid',
            username: 'alice',
            password: 'secret',
        }) as unknown as Record<string, unknown>
        expect(pg.options).toBeUndefined()
    })
})
