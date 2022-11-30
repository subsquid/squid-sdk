import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {nat} from '@subsquid/util-internal-commander'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import assert from 'assert'
import {Command, Option} from 'commander'
import {DumbInMemoryCacheOptions, DumbRedisCacheOptions, Server} from './server'


const LOG = createLogger('sqd:graphql-server')


runProgram(async () => {
    let program = new Command()
    program.description(`GraphQL server for squids`)
    program.option('--no-squid-status', 'disable .squidStatus query')
    program.option('--max-request-size <kb>', 'max request size in kilobytes', nat, 256)
    program.option('--max-root-fields <count>', 'max number of root fields in a query', nat)
    program.option('--max-response-size <nodes>', 'max response size measured in nodes', nat)
    program.option('--sql-statement-timeout <ms>', 'sql statement timeout in ms', nat)
    program.option('--subscriptions', 'enable gql subscriptions')
    program.option('--subscription-poll-interval <ms>', 'subscription poll interval in ms', nat, 5000)
    program.option('--subscription-max-response-size <nodes>', 'max response size measured in nodes', nat)
    program.addOption(new Option('--dumb-cache <type>', 'enable dumb caching').choices(['in-memory', 'redis']))
    program.option('--dumb-cache-max-age <ms>', 'cache-control max-age in milliseconds', nat, 5000)
    program.option('--dumb-cache-ttl <ms>', 'in-memory cached item TTL in milliseconds', nat, 5000)
    program.option('--dumb-cache-size <mb>', 'max in-memory cache size in megabytes', nat, 50)

    let opts = program.parse().opts() as {
        maxRequestSize: number
        maxRootFields?: number
        maxResponseSize?: number
        squidStatus?: boolean
        sqlStatementTimeout?: number
        dumbCache?: "in-memory" | "redis"
        dumbCacheMaxAge: number
        dumbCacheSize: number
        dumbCacheTtl: number
        subscriptions?: boolean
        subscriptionPollInterval: number
        subscriptionMaxResponseSize?: number
    }

    let {maxRequestSize, maxResponseSize, subscriptionMaxResponseSize, dumbCache: dumbCacheType, ...rest} = opts

    let dumbCache: DumbInMemoryCacheOptions | DumbRedisCacheOptions | undefined
    if (dumbCacheType === "redis") {
        assert(process.env.REDIS_URL, "REDIS_URL env variable must be set to enable Redis cache")
        dumbCache = {
            kind: 'redis',
            url: process.env.REDIS_URL,
            maxAgeMs: opts.dumbCacheMaxAge
        }
    } else if (dumbCacheType === 'in-memory') {
        dumbCache = {
            kind: 'in-memory',
            maxSizeMb: opts.dumbCacheSize,
            ttlMs: opts.dumbCacheTtl,
            maxAgeMs: opts.dumbCacheMaxAge
        }
    } else {
        dumbCache = undefined
    }

    let server = await new Server({
        log: LOG,
        maxRequestSizeBytes: maxRequestSize * 1024,
        maxResponseNodes: maxResponseSize,
        subscriptionMaxResponseNodes: subscriptionMaxResponseSize,
        dumbCache,
        ...rest
    }).start()

    LOG.info(`listening on port ${server.port}`)

    return waitForInterruption(server)
}, err => LOG.fatal(err))

