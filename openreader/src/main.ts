import {createLogger} from "@subsquid/logger"
import {runProgram} from "@subsquid/util-internal"
import {nat, Url} from "@subsquid/util-internal-commander"
import {waitForInterruption} from "@subsquid/util-internal-http-server"
import {Command, Option} from "commander"
import {Pool} from "pg"
import {Dialect} from "./dialect"
import {serve} from "./server"
import {loadModel} from "./tools"


const LOG = createLogger('sqd:openreader')


runProgram(async () => {
    let program = new Command()

    program.description(`
GraphQL server for postgres-compatible databases
    `.trim())

    program.requiredOption('-s, --schema <file>', 'a path to a file or folder with database description')
    program.requiredOption('-d, --db-url <url>', 'database connection string', Url(['postgres:']))
    program.addOption(
        new Option('-t, --db-type <type>', 'database type').choices(['postgres', 'cockroach']).default('postgres')
    )
    program.option('-p, --port <number>', 'port to listen on', nat, 3000)
    program.option('--sql-statement-timeout <ms>', 'sql statement timeout in ms', nat)
    program.option('--subscriptions', 'enable gql subscriptions')
    program.option('--subscription-poll-interval <ms>', 'subscription poll interval in ms', nat, 1000)
    program.option('--subscription-sql-statement-timeout <ms>', 'sql statement timeout for polling queries', nat)

    let opts = program.parse().opts() as {
        schema: string
        dbUrl: string
        dbType: Dialect
        port: number
        sqlStatementTimeout?: number
        subscriptions?: boolean
        subscriptionPollInterval: number
        subscriptionSqlStatementTimeout?: number
    }

    let model = loadModel(opts.schema)

    let connection = new Pool({
        connectionString: opts.dbUrl,
        statement_timeout: opts.sqlStatementTimeout || undefined
    })

    let subscriptionConnection: Pool | undefined
    if (opts.subscriptions) {
        subscriptionConnection = new Pool({
            connectionString: opts.dbUrl,
            statement_timeout: opts.subscriptionSqlStatementTimeout || opts.sqlStatementTimeout || undefined
        })
    }

    let server = await serve({
        model,
        dialect: opts.dbType,
        connection,
        port: opts.port,
        log: LOG,
        subscriptions: opts.subscriptions,
        subscriptionPollInterval: opts.subscriptionPollInterval,
        subscriptionConnection
    })

    LOG.info(`listening on port ${server.port}`)

    return waitForInterruption(server)
}, err => LOG.fatal(err))
