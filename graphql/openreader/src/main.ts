import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {nat, Url} from '@subsquid/util-internal-commander'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command, Option} from 'commander'
import {serve} from './server'
import {loadModel} from './tools'
import { getDefaultContext } from './context';
import { DbType } from './context/types';

const LOG = createLogger('sqd:openreader')

runProgram(async () => {
    let program = new Command()

    program.description(`
GraphQL server for postgres-compatible databases
    `.trim())

    program.requiredOption('-s, --schema <file>', 'a path to a file or folder with database description')
    program.requiredOption('-d, --db-url <url>', 'database connection string', Url(['postgres:']))
    program.addOption(
        new Option('-t, --db-type <type>', 'database type').choices(['postgres', 'cockroachdb', 'sqlite']).default('postgres')
    )
    program.option('-p, --port <number>', 'port to listen on', nat, 3000)
    program.option('--max-request-size <kb>', 'max request size in kilobytes', nat, 256)
    program.option('--max-root-fields <count>', 'max number of root fields in a query', nat)
    program.option('--max-response-size <nodes>', 'max response size measured in nodes', nat)
    program.option('--sql-statement-timeout <ms>', 'sql statement timeout in ms', nat)
    program.option('--subscriptions', 'enable gql subscriptions')
    program.option('--subscription-poll-interval <ms>', 'subscription poll interval in ms', nat, 1000)
    program.option('--subscription-max-response-size <nodes>', 'max response size measured in nodes', nat)

    let opts = program.parse().opts() as {
        schema: string
        dbUrl: string
        dbType: DbType
        port: number
        maxRequestSize: number
        maxRootFields?: number
        maxResponseSize?: number
        sqlStatementTimeout?: number
        subscriptions?: boolean
        subscriptionPollInterval: number
        subscriptionMaxResponseSize?: number
    }

    let model = loadModel(opts.schema)

    const context = await getDefaultContext(opts)

    let server = await serve({
        model,
        context,
        port: opts.port,
        log: LOG,
        subscriptions: opts.subscriptions,
        subscriptionPollInterval: opts.subscriptionPollInterval,
        subscriptionMaxResponseNodes: opts.subscriptionMaxResponseSize
    })

    LOG.info(`listening on port ${server.port}`)

    return waitForInterruption(server)
}, err => LOG.fatal(err))
