import _ from 'lodash'
import Debug from 'debug'
import {
  BlockData,
  fromBlockData,
  getExtrinsicIndex,
  getOrUndefined,
} from '../model'
import {toPayload} from "../payloads"
import { PooledExecutor } from './PooledExecutor'
import { SubstrateEventEntity, SubstrateExtrinsicEntity } from '../entities'
import { IStatusService } from '../status-service/IStatusService'
import { getConnection, EntityManager } from 'typeorm'
import { getConfig } from '../node'
import { BlockProducer } from '.'
import { getStatusService } from '../status-service'
import { eventEmitter, IndexerEvents } from '../node/event-emitter'
import { SubstrateBlockEntity } from '../entities/SubstrateBlockEntity'
import { fromBlockExtrinsic } from '../entities/SubstrateExtrinsicEntity'

const debug = Debug('index-builder:indexer')

/**
 *  This class is responsible for fetching blocks from the `BlockProducer` and saving them into the database.
 *  Internally, it creates an intance of `PooledExecutor` to asyncronously process blocks using multiple workers.
 */
export class IndexBuilder {
  private _stopped = false
  private producer!: BlockProducer
  private statusService!: IStatusService

  async start(): Promise<void> {
    debug(`Starting Index Builder`)

    this.producer = new BlockProducer()
    this.statusService = await getStatusService()

    debug('Spawned worker.')

    const lastHead = await this.statusService.getIndexerHead()

    debug(`Last indexed block in the database: ${lastHead.toString()}`)
    let startBlock = lastHead + 1

    const atBlock = getConfig().BLOCK_HEIGHT

    if (lastHead >= 0 && !getConfig().FORCE_HEIGHT) {
      debug(
        `WARNING! The database contains indexed blocks.
          The last indexed block height is ${lastHead}. The indexer
          will continue from block ${lastHead} ignoring the start
          block height hint. Set the environment variable FORCE_BLOCK_HEIGHT to true
          if you want to start from ${atBlock} anyway.`
      )
    } else {
      startBlock = Math.max(startBlock, atBlock)
    }

    debug(`Starting the block indexer at block ${startBlock}`)

    await this.producer.start(startBlock)

    const poolExecutor = new PooledExecutor(
      getConfig().WORKERS_NUMBER,
      this.producer.blockHeights(),
      this._indexBlock()
    )

    debug('Started a pool of indexers.')
    eventEmitter.on(IndexerEvents.INDEXER_STOP, async () => await this.stop())

    try {
      await poolExecutor.run(() => this._stopped)
    } finally {
      await this.stop()
    }
  }

  async stop(): Promise<void> {
    debug('Index builder has been stopped')
    this._stopped = true
    await this.producer.stop()
  }

  private _indexBlock(): (h: number) => Promise<void> {
    return async (h: number) => {
      debug(`Processing block #${h.toString()}`)

      const done = await this.statusService.isComplete(h)
      if (done) {
        debug(`Block ${h} has already been indexed`)
        return
      }

      eventEmitter.emit(IndexerEvents.BLOCK_STARTED, {
        height: h,
      })

      const blockData = await this.producer.fetchBlock(h)

      await this.transformAndPersist(blockData)

      debug(`Done block #${h.toString()}`)
    }
  }

  /**
   * Extracts events, extrinsics and block info from `BlockData` and
   * creates the corresponding entities to be saved into DB.
   *
   * @param blockData - raw block data to be saved into the DB
   */
  async transformAndPersist(blockData: BlockData): Promise<void> {
    const blockEntity = SubstrateBlockEntity.fromBlockData(blockData)

    await getConnection().transaction(async (em: EntityManager) => {
      debug(`Saving block data`)
      await em.save(blockEntity)
      debug(`Saved block data`)

      debug(`Saving extrinsics`)
      const {
        signedBlock: { block },
      } = blockData

      const extrinsicEntities: SubstrateExtrinsicEntity[] =
        block.extrinsics.map((e, index) =>
          fromBlockExtrinsic({
            e,
            blockEntity,
            indexInBlock: index,
          })
        )
      await em.save(extrinsicEntities)
      debug(`Saved ${extrinsicEntities.length} extrinsics`)

      debug(`Saving event entities`)
      const queryEventsBlock = fromBlockData(blockData)
      const batches = _.chunk(
        queryEventsBlock.blockEvents,
        getConfig().EVENT_BATCH_SIZE
      )
      debug(
        `Read ${queryEventsBlock.blockEvents.length} events; saving in ${batches.length} batches`
      )

      let saved = 0
      for (let batch of batches) {
        const qeEntities = batch.map((event) => {
          const extrinsicIndex = getExtrinsicIndex(event.eventRecord)
          const extrinsicEntity = getOrUndefined(
            extrinsicIndex,
            extrinsicEntities
          )
          return SubstrateEventEntity.fromQueryEvent({
            ...event,
            extrinsicEntity,
            blockEntity,
          })
        })
        await em.save(qeEntities)
        saved += qeEntities.length
        batch = []
        debug(`Saved ${saved} events`)
      }
    })

    eventEmitter.emit(IndexerEvents.BLOCK_COMPLETED, toPayload(blockEntity))
  }
}
