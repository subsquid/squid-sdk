import {ApiPromise} from '@polkadot/api'
import {Metadata, Option} from "@polkadot/types"
import {
    AccountId,
    BlockNumber,
    EventRecord,
    Hash,
    Header,
    LastRuntimeUpgradeInfo,
    MetadataLatest,
    RuntimeVersion,
    SignedBlock,
} from '@polkadot/types/interfaces'
import {Codec} from '@polkadot/types/types'
import BN from 'bn.js'
import Debug from 'debug'
import delay from 'delay'
import pForever from 'p-forever'
import pProps from 'p-props'
import pRetry from 'p-retry'
import {getApiPromise, getBlockTimestamp, ISubstrateService} from '.'
import {BlockData} from '../model'
import {getConfig} from "../node"
import {eventEmitter, IndexerEvents} from '../node/event-emitter'

const debug = Debug('hydra-indexer:substrate-service')

export class SubstrateService implements ISubstrateService {
  private shouldStop = false

  async init(): Promise<void> {
    debug(`Initializing SubstrateService`)
    await getApiPromise()
    await this.subscribeToHeads()

    eventEmitter.on(IndexerEvents.INDEXER_STOP, async () => await this.stop())
    // eventEmitter.on(
    //   IndexerEvents.API_CONNECTED,
    //   async () => await this.subscribeToHeads()
    // )

    pForever(async () => {
      if (this.shouldStop) {
        return pForever.end
      }
      await this.ping()
      await delay(getConfig().NODE_PING_INTERVAL)
    })
  }

  async getHeader(hash: Hash | Uint8Array | string): Promise<Header> {
    return this.apiCall(
      (api) => api.rpc.chain.getHeader(hash),
      `Getting block header of ${JSON.stringify(hash)}`
    )
  }

  getFinalizedHead(): Promise<Hash> {
    return this.apiCall(
      (api) => api.rpc.chain.getFinalizedHead(),
      `Getting finalized head`
    )
  }

  async subscribeToHeads(): Promise<void> {
    debug(`Subscribing to new heads`)
    const api = await getApiPromise()
    api.rx.rpc.chain.subscribeFinalizedHeads().subscribe({
      next: (header: Header) =>
        eventEmitter.emit(IndexerEvents.NEW_FINALIZED_HEAD, {
          header,
          height: header.number.toNumber(),
        }),
    })

    api.rx.rpc.chain.subscribeNewHeads().subscribe({
      next: (header: Header) =>
        eventEmitter.emit(IndexerEvents.NEW_BEST_HEAD, {
          header,
          height: header.number.toNumber(),
        }),
    })

    api.rx.rpc.chain.subscribeAllHeads().subscribe({
      next: (header: Header) =>
        eventEmitter.emit(IndexerEvents.NEW_HEAD, {
          header,
          height: header.number.toNumber(),
        }),
    })
  }

  // async subscribeFinalizedHeads(v: Callback<Header>): UnsubscribePromise {
  //   const api = await getApiPromise()
  //   api.rpc.chain.subscribeFinalizedHeads()
  //   return (await getApiPromise()).rpc.chain.subscribeFinalizedHeads(v)
  // }

  async getBlockHash(
    blockNumber?: BlockNumber | Uint8Array | number | string
  ): Promise<Hash> {
    debug(`Fetching block hash. BlockNumber: ${JSON.stringify(blockNumber)}`)
    return this.apiCall(
      (api) => api.rpc.chain.getBlockHash(blockNumber),
      `get block hash by height ${JSON.stringify(blockNumber)}`
    )
  }

  async getSignedBlock(hash: Hash | Uint8Array | string): Promise<SignedBlock> {
    debug(`Fething signed block: ${JSON.stringify(hash)}`)
    return this.apiCall(
      (api) => api.rpc.chain.getBlock(hash),
      `get signed block by hash ${JSON.stringify(hash)}`
    )
  }

  async eventsAt(
    hash: Hash | Uint8Array | string
  ): Promise<EventRecord[] & Codec> {
    debug(`Fething events. BlockHash:  ${JSON.stringify(hash)}`)
    return this.apiCall(
      (api) => api.query.system.events.at(hash),
      `get block events of block ${JSON.stringify(hash)}`
    )
  }

  private async apiCall<T>(
    promiseFn: (api: ApiPromise) => Promise<T>,
    functionName = 'api request'
  ): Promise<T> {
    return pRetry(
      async () => {
        if (this.shouldStop) {
          throw new pRetry.AbortError(
            'The indexer is stopping, aborting all API calls'
          )
        }
        const api = await getApiPromise()
        return promiseFn(api)
      },
      {
        retries: getConfig().SUBSTRATE_API_CALL_RETRIES,
        onFailedAttempt: (i) =>
          debug(
            `Failed to execute "${functionName}" after ${i.attemptNumber} attempts. Retries left: ${i.retriesLeft}`
          ),
      }
    )
  }

  async getBlockData(hash: Hash): Promise<BlockData> {
    const data = {
      events: this.eventsAt(hash),
      signedBlock: this.getSignedBlock(hash),
      lastUpgrade: this.lastRuntimeUpgrade(hash),
      runtimeVersion: this.runtimeVersion(hash),
      validatorId: this.validatorId(hash),
    }
    const out = (await pProps(data)) as Partial<BlockData>
    if (getConfig().VERBOSE) debug(`Out: ${JSON.stringify(out, null, 2)}`)
    out.timestamp = getBlockTimestamp(
      (out.signedBlock as SignedBlock).block.extrinsics.toArray()
    )
    return out as BlockData
  }

  async ping(): Promise<void> {
    debug(`PING`)
    const health = await this.apiCall((api) => api.rpc.system.health())
    debug(`PONG. Node health: ${JSON.stringify(health)}`)
  }

  async metadata(hash: Hash): Promise<MetadataLatest> {
    const metadata: Metadata = await this.apiCall((api) =>
      api.rpc.state.getMetadata(hash)
    )
    return metadata.asLatest
  }

  async runtimeVersion(hash: Hash): Promise<RuntimeVersion> {
    return this.apiCall((api) => api.rpc.state.getRuntimeVersion(hash))
  }

  async timestamp(hash: Hash): Promise<BN> {
    return this.apiCall((api) => api.query.timestamp.now.at(hash))
  }

  async validatorId(hash: Hash): Promise<AccountId | undefined> {
    const headerExtended = await this.apiCall((api) =>
      api.derive.chain.getHeader(hash)
    )
    return headerExtended?.author
  }

  async lastRuntimeUpgrade(
    hash: Hash
  ): Promise<LastRuntimeUpgradeInfo | undefined> {
    const info: Option<LastRuntimeUpgradeInfo> = await this.apiCall((api) =>
      api.query.system.lastRuntimeUpgrade.at(hash)
    )
    return info.unwrapOr(undefined)
  }

  async stop(): Promise<void> {
    debug(`Stopping substrate service`)
    this.shouldStop = true
    const api = await getApiPromise()
    if (api.isConnected) {
      await api.disconnect()
      debug(`Api disconnected`)
    }
    debug(`Done`)
  }
}
