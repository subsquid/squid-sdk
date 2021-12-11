import Debug from 'debug'
import * as IORedis from 'ioredis'
import {eventEmitter, IndexerEvents} from '../node/event-emitter'
import {logError} from "../util/logError"
import {getRedisFactory} from './client-factory'
import {BLOCK_COMPLETE_CHANNEL, BLOCK_START_CHANNEL} from './redis-keys'

const debug = Debug('index-builder:redis-relayer')

/**
 *  This class is listening to local events and relays them to Redis
 *  Its main purpose is to decouple most of the core classes from the
 *  Redis infrastructure
 **/
class RedisRelayer implements PubSub {
  private redisPub: IORedis.Redis

  public constructor() {
    const clientFactory = getRedisFactory()
    this.redisPub = clientFactory.getClient()
  }

  async listen(): Promise<void> {
    eventEmitter.on(IndexerEvents.BLOCK_STARTED, (data) =>
      this.publish(BLOCK_START_CHANNEL, data)
    )
    eventEmitter.on(IndexerEvents.BLOCK_COMPLETED, (data) =>
      this.publish(BLOCK_COMPLETE_CHANNEL, data)
    )
  }

  publish(topic: string, data: Record<string, unknown>): void {
    debug(`Relaying to redis: ${topic} ${JSON.stringify(data)}`)
    this.redisPub
      .publish(topic, JSON.stringify(data))
      .catch((e) => debug(`${logError(e)}`))
  }
}

export interface PubSub {
  publish(topic: string, data: Record<string, unknown>): void
}

let relayer: RedisRelayer

export function getPubSub(): PubSub {
  if (relayer) {
    return relayer
  }
  initPubSub()
  return relayer
}

// TODO: implement more flexible pubsub
export function initPubSub(): void {
  if (relayer) {
    return
  }
  relayer = new RedisRelayer()
  relayer.listen()
}
