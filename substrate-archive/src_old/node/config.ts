/* eslint-disable @typescript-eslint/naming-convention */
import { cleanEnv, str, num, url, makeValidator, bool, port } from 'envalid'
import path from 'path'
import fs from 'fs'
import Debug from 'debug'

let conf: {
  BLOCK_HEIGHT: number
  FORCE_HEIGHT: boolean
  VERBOSE: boolean
  DEBUG: string
  TYPES_JSON: Record<string, unknown>
  TYPES_ALIAS: Record<string, unknown>
  SPEC_TYPES: Record<string, unknown>
  CHAIN_TYPES: Record<string, unknown>
  BUNDLE_TYPES: Record<string, unknown>
  WS_PROVIDER_ENDPOINT_URI: string
  NODE_PING_INTERVAL: number
  REDIS_URI: string
  DB_HOST: string
  DB_PORT: number
  DB_NAME: string
  DB_USER: string
  DB_PASS: string
  DB_LOGGING: string
  // advanced consts
  BLOCK_CACHE_TTL_SEC: number
  INDEXER_HEAD_TTL_SEC: number
  WORKERS_NUMBER: number
  BLOCK_PRODUCER_FETCH_RETRIES: number
  SUBSTRATE_API_TIMEOUT: number
  SUBSTRATE_API_CALL_RETRIES: number
  NEW_BLOCK_TIMEOUT_MS: number
  HEADER_CACHE_CAPACITY: number
  FINALITY_THRESHOLD: number
  EVENT_BATCH_SIZE: number
}

let dbConf: {
  DB_HOST: string
  DB_PORT: number
  DB_NAME: string
  DB_USER: string
  DB_PASS: string
  DB_LOGGING: string
}

const jsonPath = makeValidator<Record<string, unknown>>(
  (p: string | undefined | unknown): Record<string, unknown> => {
    if (p === undefined || p === '' || p === 'undefined') {
      return {}
    }

    if (typeof p === 'object') {
      return p as Record<string, unknown>
    }

    let jsonFile: string
    try {
      jsonFile = fs.readFileSync(path.resolve(<string>p), 'utf-8')
    } catch {
      throw new Error(`Can't open file ${p}`)
    }
    try {
      return JSON.parse(jsonFile)
    } catch {
      throw new Error(`Invalid JSON: ${p}`)
    }
  }
)

function removeUndefinedEnvs(): void {
  Object.keys(process.env).map((key) => {
    if (process.env[key] === 'undefined' || process.env[key] === '') {
      delete process.env[key]
    }
  })
}

export function dbConfigure(): void {
  process.env.DB_HOST = process.env.TYPEORM_HOST || process.env.DB_HOST
  process.env.DB_PORT = process.env.TYPEORM_PORT || process.env.DB_PORT
  process.env.DB_USER = process.env.TYPEORM_USERNAME || process.env.DB_USER
  process.env.DB_PASS = process.env.TYPEORM_PASSWORD || process.env.DB_PASS
  process.env.DB_NAME = process.env.TYPEORM_DATABASE || process.env.DB_NAME
  process.env.DB_LOGGING = process.env.TYPEORM_LOGGING || process.env.DB_LOGGING

  removeUndefinedEnvs()

  dbConf = cleanEnv(process.env, {
    DB_NAME: str(),
    DB_HOST: str({ devDefault: 'localhost', desc: `Database host` }),
    DB_PORT: port({ devDefault: 5432, desc: `Database port` }),
    DB_USER: str({ devDefault: 'postgres', desc: `Database user` }),
    DB_PASS: str({ devDefault: 'postgres', desc: `Database user passowrd` }),
    DB_LOGGING: str({
      choices: [
        'error',
        'query',
        'schema',
        'warn',
        'info',
        'log',
        'true',
        'all',
      ],
      default: 'error',
      desc: 'Typeorm logging level',
    }),
  })
}

export function configure(): void {
  removeUndefinedEnvs()

  conf = {
    ...cleanEnv(process.env, {
      BLOCK_HEIGHT: num({
        default: 0,
        desc: `Block height the indexer starts from. If there are indexed blocks, it continues from the last unprocessed block`,
      }),
      FORCE_HEIGHT: bool({
        default: false,
        desc: 'If set to true, will enforce BLOCH_HEIGHT',
      }),
      DEBUG: str({ default: 'hydra-indexer:*,index-builder:*' }),
      VERBOSE: bool({
        default: false,
        desc: 'Extra verbosity in the debug output',
      }),
      TYPES_JSON: jsonPath({
        default: {},
        desc: `path to JSON with custom substrate type definitions`,
      }), // optional
      TYPES_ALIAS: jsonPath({
        default: {},
        desc: `path to JSON with custom type aliases`,
      }),
      SPEC_TYPES: jsonPath({
        default: {},
        desc: `path to JSON with spec-level type definitions`,
      }),
      CHAIN_TYPES: jsonPath({
        default: {},
        desc: `path to JSON with chain-level type definitions`,
      }),
      BUNDLE_TYPES: jsonPath({
        default: {},
        desc: `path to JSON with bundle type definitions`,
      }),
      WS_PROVIDER_ENDPOINT_URI: url(),
      REDIS_URI: url(),
      NODE_PING_INTERVAL: num({
        default: 60 * 1000,
        desc: 'Interval for pinging the substate node health',
      }),
      // advanced consts
      // keep one hour of blocks by default
      BLOCK_CACHE_TTL_SEC: num({
        default: 60 * 60,
        desc: 'TTL for keeping block cache',
      }),
      // expire indexer head key after 15 minutes
      INDEXER_HEAD_TTL_SEC: num({
        default: 60 * 15,
        desc: 'TTL for indexer head ',
      }),

      // Number of indexer workers
      WORKERS_NUMBER: num({ default: 5, desc: 'Number of workers' }),

      // Number of time the worker tries to fetch a block
      BLOCK_PRODUCER_FETCH_RETRIES: num({
        default: 3,
        desc: 'Number of times a worker retries to fetch a block before giving up',
      }),

      // Timeout (in milliseconds) for each API call
      SUBSTRATE_API_TIMEOUT: num({
        default: 1000 * 60 * 5,
        desc: 'Timeout for API calls',
      }),
      // Number of times an API call is retried before giving up and throwing and error
      SUBSTRATE_API_CALL_RETRIES: num({
        default: 5,
        desc: 'Number of times an API call is retried before giving up and throwing and error',
      }),

      // If the block producer does not recieve a new block within this time limit,
      // panic and thow an error. This is needed to prevent the situation when the
      // API is disconnected yet no error is thrown, with the block producer stuck in the waiting loop
      NEW_BLOCK_TIMEOUT_MS: num({
        default: 60 * 10 * 1000,
        desc: `If the block producer does not recieve a new block within this time limit,
panic and throw an error. This is needed to prevent the situation when the
API is disconnected yet no error is thrown, with the block producer stuck in the waiting loop`,
      }),

      // number of finalized block headers retained in memory
      HEADER_CACHE_CAPACITY: num({
        desc: 'number of finalized block headers retained in memory',
        default: 100,
      }),

      // before resolving the block hash by the height, wait until it's behind the chain height
      // by at least that many blocks
      FINALITY_THRESHOLD: num({
        desc: ` before resolving the block hash by the height, wait until it's behind the chain height
by at least that many blocks`,
        default: 5,
      }),

      EVENT_BATCH_SIZE: num({
        default: 100,
        desc: 'maximal number of events from a block to be saved in an single db insert batch',
      }),
    }),
    ...getDBConfig(),
  }

  Debug.enable(conf.DEBUG)
}

export function getDBConfig(): typeof dbConf {
  if (dbConf !== undefined) return dbConf
  dbConfigure()
  return dbConf
}

export function getConfig(): typeof conf {
  if (conf !== undefined) return conf
  configure()
  return conf
}
