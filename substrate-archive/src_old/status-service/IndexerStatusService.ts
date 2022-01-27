import Debug from 'debug'
import * as IORedis from 'ioredis'
import * as pWaitFor from 'p-wait-for'
import * as dal from '../db/dal'
import {getConfig as conf} from '../node'
import {eventEmitter, IndexerEvents} from '../node/event-emitter'
import {BlockPayload} from "../payloads"
import {getRedisFactory} from '../redis/client-factory'
import {
    BLOCK_CACHE_PREFIX,
    BLOCK_COMPLETE_CHANNEL,
    BLOCK_START_CHANNEL,
    EVENT_LAST,
    EVENT_TOTAL,
    INDEXER_HEAD_BLOCK,
    INDEXER_NEW_HEAD_CHANNEL,
    INDEXER_STATUS,
} from '../redis/redis-keys'
import {logError} from "../util/logError"
import {IStatusService} from './IStatusService'

const debug = Debug('hydra-indexer:status-server')

export class IndexerStatusService implements IStatusService {
  private redisSub: IORedis.Redis
  private redisPub: IORedis.Redis
  private redisClient: IORedis.Redis

  private _isLoading = false

  constructor() {
    debug(`Creating status service`)
    const clientFactory = getRedisFactory()
    this.redisSub = clientFactory.getClient()
    this.redisPub = clientFactory.getClient()
    this.redisClient = clientFactory.getClient()
  }

  async init(): Promise<void> {
    debug(`Initializing status service`)
    await this.redisSub.subscribe([BLOCK_START_CHANNEL, BLOCK_COMPLETE_CHANNEL])

    this.redisSub.on('message', (channel, message) => {
      this.onNewMessage(channel, message).catch((e) => {
        debug(`Error connecting to Redis: ${logError(e)}`)
      })
    })

    // eslint-disable-next-line
    eventEmitter.on(IndexerEvents.NEW_FINALIZED_HEAD, async ({ height }) => {
      await this.redisClient.hset(INDEXER_STATUS, 'CHAIN_HEIGHT', height)
    })
  }

  async onBlockComplete(payload: BlockPayload): Promise<void> {
    if (await this.isComplete(payload.height)) {
      debug(`Ignoring ${payload.height}: already processed`)
      return
    }

    // TODO: move into a separate cache service and cache also events, extrinsics etc
    await this.updateBlockCache(payload)
    await this.updateIndexerHead()
    await this.updateLastEvents(payload)
    await this.updateCompleteMetrics(payload.height)
  }

  async updateCompleteMetrics(height: number): Promise<void> {
    await this.redisClient.hset(INDEXER_STATUS, 'LAST_COMPLETE', height)
    const max = await this.redisClient.hget(INDEXER_STATUS, 'MAX_COMPLETE')
    if (!max || Number.parseInt(max) < height) {
      await this.redisClient.hset(INDEXER_STATUS, 'MAX_COMPLETE', height)
    }
  }

  async onNewMessage(channel: string, message: string): Promise<void> {
    if (channel === BLOCK_COMPLETE_CHANNEL) {
      const payload = JSON.parse(message) as BlockPayload
      await this.onBlockComplete(payload)
    }
  }

  async getIndexerHead(): Promise<number> {
    const headVal = await this.redisClient.get(INDEXER_HEAD_BLOCK)
    if (headVal !== null) {
      return Number.parseInt(headVal)
    }

    await pWaitFor.default(() => !this._isLoading)
    debug(`Redis cache is empty, loading from the database`)
    this._isLoading = true
    const _indexerHead = await this.slowIndexerHead()
    this._isLoading = false
    debug(`Loaded ${_indexerHead}`)
    await this.updateHeadKey(_indexerHead)
    return _indexerHead
  }

  /**
   * Simply re-delegate to simplify mocking purpose
   * */
  slowIndexerHead(): Promise<number> {
    return dal.getIndexerHead()
  }

  private async updateHeadKey(height: number): Promise<void> {
    // set TTL to the indexer head key. If the indexer status is stuck for some reason,
    // this will result in fetching the indexer head from the database
    await this.redisClient.set(
      INDEXER_HEAD_BLOCK,
      height,
      'EX',
      conf().INDEXER_HEAD_TTL_SEC
    )
    await this.redisPub.publish(
      INDEXER_NEW_HEAD_CHANNEL,
      JSON.stringify({ height })
    )
    await this.redisClient.hset(INDEXER_STATUS, 'HEAD', height)

    debug(`Updated the indexer head to ${height}`)
  }

  async updateLastEvents(payload: BlockPayload): Promise<void> {
    if (!payload.events) {
      debug(`No events in the payload`)
      return
    }
    for (const e of payload.events) {
      await this.redisClient.hset(EVENT_LAST, e.name, e.id)
      await this.redisClient.hincrby(EVENT_TOTAL, e.name, 1)
      await this.redisClient.hincrby(EVENT_TOTAL, 'ALL', 1)
    }
  }

  async updateBlockCache(payload: BlockPayload): Promise<void> {
    await this.redisClient.set(
      `${BLOCK_CACHE_PREFIX}:${payload.height}`,
      JSON.stringify(payload),
      'EX',
      conf().BLOCK_CACHE_TTL_SEC
    )
  }

  async isComplete(h: number): Promise<boolean> {
    const head = await this.getIndexerHead() // this op is fast
    if (h <= head) {
      return true
    }
    const key = `${BLOCK_CACHE_PREFIX}:${h}`
    const isRecent = await this.redisClient.get(key)
    const isComplete = isRecent !== null
    if (isComplete) {
      await this.redisClient.expire(key, conf().BLOCK_CACHE_TTL_SEC)
    }
    return isComplete
  }

  /**
   *
   * @param h height of the completed block
   */
  async updateIndexerHead(): Promise<void> {
    let head = await this.getIndexerHead()
    let nextHeadComplete = false
    do {
      nextHeadComplete = await this.isComplete(head + 1)
      if (nextHeadComplete) {
        head++
      }
    } while (nextHeadComplete)

    const currentHead = await this.getIndexerHead()
    if (head > currentHead) {
      debug(`Updating the indexer head from ${currentHead} to ${head}`)
      await dal.setIndexerHeight(head)
      await this.updateHeadKey(head)
    }
  }
}
