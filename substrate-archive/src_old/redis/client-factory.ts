import Debug from 'debug'
import Redis from 'ioredis'
import {getConfig} from "../node"
import {eventEmitter, IndexerEvents} from '../node/event-emitter'
import {logError} from "../util/logError"

const debug = Debug('index-builder:redis-factory')

let clientFactory: RedisClientFactory

export function getRedisFactory(): RedisClientFactory {
  if (clientFactory) {
    return clientFactory
  }
  debug(`Initializing Redis Client Factory`)
  clientFactory = new RedisClientFactory(getConfig().REDIS_URI)
  return clientFactory
}

eventEmitter.on(IndexerEvents.INDEXER_STOP, () => {
  if (clientFactory) {
    debug(`Closing Redis connections`)
    clientFactory.stop()
  }
})

export class RedisClientFactory {
  private clients: Redis.Redis[] = []
  private factoryMetod: () => Redis.Redis

  public constructor(redisURI?: string, options?: Redis.RedisOptions) {
    if (options) {
      this.factoryMetod = () => new Redis(options)
      debug(`Using RedisOptions`)
      return
    }

    const uri = redisURI || process.env.REDIS_URI
    if (uri) {
      this.factoryMetod = () => new Redis(uri)
      debug(`Using ${uri} for Redis clients`)
    } else {
      throw new Error(`Redis URL is not provided`)
    }
  }

  getClient(): Redis.Redis {
    const client = this.factoryMetod()
    this.clients.push(client)
    return client
  }

  stop(): void {
    for (const client of this.clients) {
      if (client) {
        try {
          client.disconnect()
        } catch (e) {
          debug(`Failed to disconnect redis client: ${logError(e)}`)
        }
      }
    }
  }
}
