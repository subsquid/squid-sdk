import {createLogger} from "@subsquid/logger"
import {runProgram} from "@subsquid/util-internal"
import {nat} from "@subsquid/util-internal-commander"
import {waitForInterruption} from "@subsquid/util-internal-http-server"
import {Command} from "commander"
import {Server} from "./server"


const LOG = createLogger('sqd:graphql-server')


runProgram(async () => {
    let program = new Command()
    program.description(`GraphQL server for squids`)
    program.option('--sql-statement-timeout <ms>', 'sql statement timeout in ms', nat)
    program.option('--subscriptions', 'enable gql subscriptions')
    program.option('--subscription-poll-interval <ms>', 'subscription poll interval in ms', nat, 1000)
    program.option('--subscription-sql-statement-timeout <ms>', 'sql statement timeout for polling queries', nat)

    let opts = program.parse().opts() as {
        sqlStatementTimeout?: number
        subscriptions?: boolean
        subscriptionPollInterval: number
        subscriptionSqlStatementTimeout?: number
    }

    let server = await new Server(opts).start()
    LOG.info(`listening on port ${server.port}`)
    return waitForInterruption(server)
}, err => LOG.fatal(err))

