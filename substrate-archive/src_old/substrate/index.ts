import { ApiPromise, WsProvider } from '@polkadot/api'
import {
  RegistryTypes,
  OverrideBundleType,
  OverrideModuleType,
} from '@polkadot/types/types'
import pRetry from 'p-retry'
import Debug from 'debug'
import { getConfig } from '../node'
import { ISubstrateService } from './ISubstrateService'
import { SubstrateService } from './SubstrateService'
import { eventEmitter, IndexerEvents } from '../node/event-emitter'

export * from './ISubstrateService'
export * from './SubstrateService'
export { getBlockTimestamp } from './timestamp'

const debug = Debug('hydra-indexer:substrate-api')

let substrateService: ISubstrateService
let apiPromise: ApiPromise

export async function getSubstrateService(): Promise<ISubstrateService> {
  if (substrateService) {
    return substrateService
  }
  substrateService = new SubstrateService()
  await (substrateService as SubstrateService).init()
  return substrateService
}

export async function getApiPromise(): Promise<ApiPromise> {
  if (apiPromise) {
    return apiPromise
  }

  debug(`Creating new Api Promise`)

  const conf = getConfig()
  const provider = new WsProvider(conf.WS_PROVIDER_ENDPOINT_URI)

  const names = Object.keys(conf.TYPES_JSON)

  names.length && debug(`Injected types: ${names.join(', ')}`)

  apiPromise = await pRetry(
    async () =>
      new ApiPromise({
        provider,
        types: conf.TYPES_JSON as RegistryTypes,
        typesAlias: conf.TYPES_ALIAS as Record<string, OverrideModuleType>,
        typesBundle: conf.BUNDLE_TYPES as OverrideBundleType,
        typesSpec: conf.SPEC_TYPES as Record<string, RegistryTypes>,
        typesChain: conf.CHAIN_TYPES as Record<string, RegistryTypes>,
      }).isReadyOrError,
    {
      retries: 99, // large enough
      onFailedAttempt: (error) =>
        debug(`API failed to connect: ${JSON.stringify(error)}`),
    }
  )

  apiPromise.on('error', async (e) => {
    debug(`Api error: ${JSON.stringify(e)}, reconnecting....`)
    apiPromise = await getApiPromise()
  })

  apiPromise.on('connected', () => {
    debug(`Api connected`)
    eventEmitter.emit(IndexerEvents.API_CONNECTED)
  })

  return apiPromise
}
