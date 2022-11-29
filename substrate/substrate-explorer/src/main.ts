import {createLogger} from '@subsquid/logger'
import {Dialect} from '@subsquid/openreader/lib/dialect'
import {serve} from '@subsquid/openreader/lib/server'
import {loadModel} from '@subsquid/openreader/lib/tools'
import {ConnectionOptions, createConnectionOptions} from '@subsquid/typeorm-config/lib/connectionOptions'
import {runProgram} from '@subsquid/util-internal'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import * as path from 'path'
import {Pool} from 'pg'


const log = createLogger('sqd:substrate-explorer')


runProgram(async () => {
    let model = loadModel(
        path.join(__dirname, "../schema.graphql")
    )

    let dialect: Dialect = 'postgres'
    if (process.env.DB_TYPE) {
        switch(process.env.DB_TYPE) {
            case 'cockroach':
                dialect = 'cockroach'
                break
            case 'postgres':
                break
            default:
                throw new Error(
                    `Incorrect env variable DB_TYPE: ${process.env.DB_TYPE}. Allowed values: postgres, cockroach`
                )
        }
    }

    let connectionOptions = createConnectionOptions()
    let connectionUrl = createConnectionUrl(connectionOptions)
    let poolSize = envNat('GQL_DB_CONNECTION_POOL_SIZE') || 5

    let pool = new Pool({
        host: connectionOptions.host,
        port: connectionOptions.port,
        database: connectionOptions.database,
        user: connectionOptions.username,
        password: connectionOptions.password,
        statement_timeout: envNat('GQL_DB_STATEMENT_TIMEOUT_MS'),
        max: poolSize,
        min: poolSize
    })

    await pool.connect().then(con => {
        con.release()
        log.info(`connected to ${connectionUrl}`)
    }, err => {
        log.warn({err}, `failed to connect to ${connectionUrl}`)
    })

    let server = await serve({
        model,
        dialect,
        connection: pool,
        port: 3000,
        graphiqlConsole: true,
        log,
        maxRequestSizeBytes: 64 * 1024,
        maxRootFields: envNat('GQL_MAX_ROOT_FIELDS'),
        maxResponseNodes: envNat('GQL_MAX_RESPONSE_NODES')
    })

    log.info(`listening on port ${server.port}`)

    return waitForInterruption(server)
}, err => log.fatal(err))


function createConnectionUrl(options: ConnectionOptions): string {
    let url = new URL('postgres://localhost:5432')
    url.host = options.host
    url.port = ''+options.port
    url.username = options.username
    url.pathname = options.database
    return url.toString()
}


function envNat(name: string): number | undefined {
    let env = process.env[name]
    if (!env) return undefined
    let val = parseInt(env, 10)
    if (Number.isSafeInteger(val) && val >= 0) return val
    throw new Error(`Invalid env variable ${name}: ${env}. Expected positive integer`)
}
