import Debug from 'debug'
import {Connection, getConnection} from 'typeorm'
import {configure} from '.'
import {createDBConnection} from '../db'
import {IndexBuilder} from '../indexer'
import {initPubSub} from '../redis/RedisRelayer'
import {logError} from "../util/logError"
import {eventEmitter, IndexerEvents} from './event-emitter'

const debug = Debug('hydra-indexer:manager')

/**
 * A wrapper class for running the indexer and migrations
 */
export class IndexerStarter {
  /**
   * Starts the indexer
   *
   * @param options options passed to create the indexer service
   */
  static async index(): Promise<void> {
    debug(`Hydra Indexer version: ${getHydraVersion()}`)

    configure()
    await createDBConnection()
    debug(`Database connection OK`)

    initPubSub()
    debug(`PubSub OK`)

    // Start only the indexer
    const indexBuilder = new IndexBuilder()
    try {
      await indexBuilder.start()
    } catch (e) {
      debug(`Stopping the indexer due to errors: ${logError(e)}`)
      process.exitCode = -1
    } finally {
      await cleanUp()
    }
  }

  /**
   * Run migrations in the "migrations" folder;
   */
  static async migrate(): Promise<void> {
    let connection: Connection | undefined
    try {
      connection = await createDBConnection()
      if (connection) await connection.runMigrations()
    } finally {
      if (connection) await connection.close()
    }
  }
}

function getHydraVersion(): string {
  return process.env.npm_package_version || 'UNKNOWN'
}

export async function cleanUp(): Promise<void> {
  debug(`Cleaning up the indexer...`)
  try {
    eventEmitter.emit(IndexerEvents.INDEXER_STOP)
  } catch (e) {
    // ignore
  }

  try {
    const connection = getConnection()
    if (connection && connection.isConnected) {
      debug('Closing the database connection')
      await connection.close()
    }
  } catch (e) {
    debug(`Error cleaning up: ${logError(e)}`)
  }
  debug(`Bye!`)
  process.exit()
}
