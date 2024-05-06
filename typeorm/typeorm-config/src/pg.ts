import {createLogger} from '@subsquid/logger'
import * as fs from 'fs'
import assert from 'assert'
import type {ConnectionOptions, SslOptions} from './connectionOptions'


const log = createLogger('sqd:typeorm-config')


export function isPostgres(url: URL): boolean {
    switch(url.protocol) {
        case 'postgres:':
        case 'postgresql:':
            return true
        default:
            return false
    }
}


export function extractAndClearSSLParams(url: URL): SslOptions | undefined | false {
    let ssl: SslOptions = {}
    let disabled = false
    let hasMode = false
    for (let [k, v] of Array.from(url.searchParams.entries())) {
        switch(k) {
            case 'ssl':
                switch(v) {
                    case 'true':
                    case '1':
                        break
                    case 'false':
                    case '0':
                        disabled = true
                        break
                    default:
                        log.warn(`ignoring ${k}=${v}, because ${k} can only have values true, false, 1 and 0`)
                }
                url.searchParams.delete(k)
                break
            case 'sslmode':
                switch(v) {
                    case 'disabled':
                    case 'disable':
                        disabled = true
                        break
                    case 'no-verify':
                        ssl.rejectUnauthorized = false
                        break
                    case 'prefer':
                    case 'require':
                    case 'verify-ca':
                    case 'verify-full':
                        // those are not treated specially by node-postgres
                        break
                }
                hasMode = true
                url.searchParams.delete(k)
                break
            case 'sslcert':
                ssl.cert = fs.readFileSync(v, 'utf-8')
                url.searchParams.delete(k)
                break
            case 'sslkey':
                ssl.key = fs.readFileSync(v, 'utf-8')
                url.searchParams.delete(k)
                break
            case 'sslrootcert':
                ssl.ca = fs.readFileSync(v, 'utf-8')
                url.searchParams.delete(k)
                break
        }
    }
    if (disabled) return false
    if (hasMode || Object.keys(ssl).length > 0) return ssl
}


export interface PgClientConfig {
    connectionString?: string
    user?: string
    database?: string
    password?: string
    port?: number
    host?: string
    ssl?: SslOptions | boolean
}


export function toPgClientConfig(con: ConnectionOptions): PgClientConfig {
    if (con.url) {
        let pg: PgClientConfig = {
            connectionString: con.url
        }
        if (con.ssl) {
            pg.ssl = con.ssl
        }
        return pg
    } else {
        assert(con.url == null)
        let {username, ...rest} = con
        return {
            user: username,
            ...rest
        }
    }
}
