import {createLogger} from '@subsquid/logger'
import assert from 'assert'
import * as fs from 'fs'
import process from 'process'
import {extractAndClearSSLParams, isPostgres} from './pg'


const log = createLogger('sqd:typeorm-config')


export type ConnectionOptions = UrlConnection | ParamConnection


interface UrlConnection {
    url: string
    ssl?: SslOptions | false
}


interface ParamConnection {
    url?: undefined
    host: string
    port: number
    database: string
    username: string
    password: string
    ssl?: SslOptions | false
}


export interface SslOptions {
    ca?: string
    cert?: string
    key?: string
    rejectUnauthorized?: boolean
}


export function createConnectionOptions(): ConnectionOptions {
    let con: ConnectionOptions

    if (process.env.DB_URL) {
        log.debug('using connection string from DB_URL')

        let url = new URL(process.env.DB_URL)

        if (!isPostgres(url)) {
            throw new Error('Only postgres:// or postgresql:// protocols are supported')
        }

        if (process.env.DB_HOST) {
            log.warn('ignoring DB_HOST, because DB_URL is set')
        }

        if (process.env.DB_PORT) {
            log.warn('ignoring DB_PORT, because DB_URL is set')
        }

        if (process.env.DB_USER) {
            if (url.username) {
                log.warn('ignoring DB_USER, because DB_URL is set')
            } else {
                log.debug('setting username from DB_USER')
                url.username = process.env.DB_USER
            }
        }

        if (process.env.DB_PASS) {
            if (url.password) {
                log.warn('ignoring DB_PASS, because DB_URL is set')
            } else {
                log.debug('setting password from DB_PASS')
                url.password = process.env.DB_PASS
            }
        }

        if (process.env.DB_NAME) {
            log.warn(`ignoring DB_NAME, because DB_URL is set`)
        }

        let ssl: SslOptions | undefined | false
        if (isPostgres(url)) {
            ssl = extractAndClearSSLParams(url)
        }

        con = {
            url: url.toString()
        }

        if (ssl != null) {
            con.ssl = ssl
        }
    } else {
        let host = 'localhost'
        let port = 5432
        let database = 'postgres'
        let username = 'postgres'
        let password = 'postgres'

        if (process.env.DB_HOST) {
            log.debug('setting host from DB_HOST')
            host = process.env.DB_HOST
        }

        if (process.env.DB_PORT) {
            log.debug('setting port from DB_PORT')
            port = parseInt(process.env.DB_PORT)
            assert(Number.isSafeInteger(port), 'invalid port number in DB_PORT env var')
        }

        if (process.env.DB_NAME) {
            log.debug('setting database name from DB_NAME')
            database = process.env.DB_NAME
        }

        if (process.env.DB_USER) {
            log.debug('setting username from DB_USER')
            username = process.env.DB_USER
        }

        if (process.env.DB_PASS) {
            log.debug('setting password from DB_PASS')
            password = process.env.DB_PASS
        }

        con = {
            host,
            port,
            database,
            username,
            password
        }
    }

    if (con.ssl != null && process.env.DB_SSL) {
        log.warn('ignoring DB_SSL, because SSL settings where provided in DB_URL')
    } else if (con.ssl || (con.ssl == null && getDbSsl())) {
        let ssl: SslOptions = con.ssl || (con.ssl = {})

        if (process.env.DB_SSL_CA) {
            if (ssl.ca) {
                log.warn('ignoring DB_SSL_CA, because CA was set in DB_URL')
            } else {
                log.debug('setting CA from DB_SSL_CA')
                ssl.ca = process.env.DB_SSL_CA
            }
        }

        if (process.env.DB_SSL_CA_FILE) {
            if (ssl.ca) {
                let reason = process.env.DB_SSL_CA ? 'DB_SSL_CA is set' : 'CA was set in DB_URL'
                log.warn(`ignoring DB_SSL_CA_FILE, because ${reason}`)
            } else {
                log.debug(`setting CA from ${process.env.DB_SSL_CA_FILE}`)
                ssl.ca = fs.readFileSync(process.env.DB_SSL_CA_FILE, 'utf-8')
            }
        }

        if (process.env.DB_SSL_CERT) {
            if (ssl.cert) {
                log.warn('ignoring DB_SSL_CERT, because SSL certificate was set in DB_URL')
            } else {
                log.debug('setting client cert from DB_SSL_CERT')
                ssl.cert = process.env.DB_SSL_CERT
            }
        }

        if (process.env.DB_SSL_CERT_FILE) {
            if (ssl.cert) {
                let reason = process.env.DB_SSL_CERT ? 'DB_SSL_CERT is set' : 'SSL certificate was set in DB_URL'
                log.warn(`ignoring DB_SSL_CERT_FILE, because ${reason}`)
            } else {
                log.debug(`setting client cert from ${process.env.DB_SSL_CERT_FILE}`)
                ssl.cert = fs.readFileSync(process.env.DB_SSL_CERT_FILE, 'utf-8')
            }
        }

        if (process.env.DB_SSL_KEY) {
            if (ssl.key) {
                log.warn('ignoring DB_SSL_KEY, because SSL key was set in DB_URL')
            } else {
                log.debug('setting client private key from DB_SSL_KEY')
                ssl.key = process.env.DB_SSL_KEY
            }
        }

        if (process.env.DB_SSL_KEY_FILE) {
            if (ssl.key) {
                let reason = process.env.DB_SSL_KEY ? 'DB_SSL_KEY is set' : 'SSL key was set in DB_URL'
                log.warn(`ignoring DB_SSL_KEY_FILE, because ${reason}`)
            } else {
                log.debug(`setting client private key from ${process.env.DB_SSL_KEY_FILE}`)
                ssl.key = fs.readFileSync(process.env.DB_SSL_KEY_FILE, 'utf-8')
            }
        }

        if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
            log.warn('DB_SSL_REJECT_UNAUTHORIZED was set to false, server authorization errors will be ignored')
            ssl.rejectUnauthorized = false
        }
    }

    if (log.isDebug()) {
        log.debug(getDebugProps(con), 'gathered connection parameters')
    }

    return con
}


function getDbSsl(): boolean {
    if (!process.env.DB_SSL) return false
    switch(process.env.DB_SSL) {
        case 'true':
            return true
        case 'false':
            return false
        default:
            log.warn(
                `ignoring DB_SSL env var as it has unrecognized value "${process.env.DB_SSL}". ` +
                `Only allowed values are "true" and "false"`
            )
            return false
    }
}


function getDebugProps(con: ConnectionOptions) {
    let {ssl, ...params} = con
    let info: any = {}
    if (params.url) {
        let url = new URL(params.url)
        if (url.password) {
            url.password = '***'
        }
        info.url = url.toString()
    } else {
        Object.assign(info, params)
        if (info.password) {
            info.password = '***'
        }
    }
    if (ssl) {
        info.sslEnabled = true
        info.sslCa = ssl.ca
        info.sslCert = ssl.cert
        if (ssl.key) {
            info.sslPrivateKey = '***'
        }
        if (ssl.rejectUnauthorized === false) {
            info.sslRejectUnauthorized = false
        }
    } else if (ssl === false) {
        info.sslEnabled = false
    }
    return info
}
