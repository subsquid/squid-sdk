import {createLogger} from "@subsquid/logger"
import {Dialect} from "@subsquid/openreader/lib/dialect"
import {serve} from "@subsquid/openreader/lib/server"
import {loadModel} from "@subsquid/openreader/lib/tools"
import {ConnectionOptions, createConnectionOptions} from "@subsquid/typeorm-config/lib/connectionOptions"
import {runProgram} from "@subsquid/util-internal"
import {waitForInterruption} from "@subsquid/util-internal-http-server"
import * as path from "path"
import {Pool} from "pg"


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

    let pool = new Pool({
        host: connectionOptions.host,
        port: connectionOptions.port,
        database: connectionOptions.database,
        user: connectionOptions.username,
        password: connectionOptions.password,
        statement_timeout: 2000
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
        maxRequestSizeBytes: 64 * 1024
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
