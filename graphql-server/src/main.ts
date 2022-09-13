import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {nat} from '@subsquid/util-internal-commander'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command, Option} from 'commander'
import assert from 'assert'
import {CacheOptions, InMemoryCacheOptions, RedisCacheOptions, Server} from './server'


const LOG = createLogger('sqd:graphql-server')


runProgram(async () => {
    let program = new Command()
    program.description(`GraphQL server for squids`)
    program.option('--no-squid-status', 'disable .squidStatus query')
    program.option('--max-request-size <kb>', 'max request size in kilobytes', nat, 256)
    program.option('--max-root-fields <count>', 'max number of root fields in a query', nat)
    program.option('--max-response-size <nodes>', 'max response size measured in nodes', nat)
    program.addOption(new Option('--cache <type>', 'enable caching').choices(['in-memory', 'redis']))
    program.option('--cache-size <mb>', 'max in-memory cache size in megabytes', nat, 50)
    program.option('--cache-ttl <ms>', 'cache TTL in ms', nat, 1000)
    program.option('--sql-statement-timeout <ms>', 'sql statement timeout in ms', nat)
    program.option('--subscriptions', 'enable gql subscriptions')
    program.option('--subscription-poll-interval <ms>', 'subscription poll interval in ms', nat, 5000)
    program.option('--subscription-max-response-size <nodes>', 'max response size measured in nodes', nat)

    let opts = program.parse().opts() as {
        maxRequestSize: number
        maxRootFields?: number
        maxResponseSize?: number
        squidStatus?: boolean
        sqlStatementTimeout?: number
        cache?: "in-memory" | "redis"
        cacheSize: number
        cacheTtl: number
        subscriptions?: boolean
        subscriptionPollInterval: number
        subscriptionMaxResponseSize?: number
    }

    let {maxRequestSize, maxResponseSize, subscriptionMaxResponseSize, ...rest} = opts

    let cacheOptions: CacheOptions | undefined
    if (opts.cache) {
        let cacheOpts: RedisCacheOptions | InMemoryCacheOptions | undefined
    
        if (opts.cache === "redis") {
            assert(process.env.REDIS_URL, "REDIS_URL env variable must be set to enable Redis cache")
            cacheOpts = {
              url: process.env.REDIS_URL
            }
        } else if (opts.cache === "in-memory") {
            cacheOpts = {
              maxSizeMb: opts.cacheSize,
              ttlMs: opts.cacheTtl
            }
        } 
        assert(cacheOpts)
        cacheOptions = {
          type: opts.cache,
          opts: cacheOpts,
          // while there's a slight difference,
          // it's reasonable to use the same value 
          // for maxAge and TTL and re-use this setting
          maxAgeMs: opts.cacheTtl
        }
    }

    let server = await new Server({
        log: LOG,
        maxRequestSizeBytes: maxRequestSize * 1024,
        maxResponseNodes: maxResponseSize,
        subscriptionMaxResponseNodes: subscriptionMaxResponseSize,
        cacheOptions,
        ...rest
    }).start()

    LOG.info(`listening on port ${server.port}`)

    return waitForInterruption(server)
}, err => LOG.fatal(err))

