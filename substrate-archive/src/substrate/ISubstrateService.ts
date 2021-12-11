import {
  Hash,
  Header,
  BlockNumber,
  EventRecord,
  SignedBlock,
  MetadataLatest,
  RuntimeVersion,
  LastRuntimeUpgradeInfo,
} from '@polkadot/types/interfaces'
import { Codec } from '@polkadot/types/types'
import BN from 'bn.js'
import { BlockData } from '../model'

/**
 * A wrapper over Polkadot JS API encapsulating
 * RPC calls to the node.
 *
 */
export interface ISubstrateService {
  getFinalizedHead(): Promise<Hash>
  getHeader(hash?: Hash | Uint8Array | string): Promise<Header>
  getBlockHash(
    blockNumber?: BlockNumber | Uint8Array | number | string
  ): Promise<Hash>
  getSignedBlock(hash?: Hash | Uint8Array | string): Promise<SignedBlock>
  eventsAt(hash: Hash | Uint8Array | string): Promise<EventRecord[] & Codec>

  metadata(hash: Hash): Promise<MetadataLatest>
  lastRuntimeUpgrade(hash: Hash): Promise<LastRuntimeUpgradeInfo | undefined>
  runtimeVersion(hash: Hash): Promise<RuntimeVersion>
  timestamp(hash: Hash): Promise<BN>

  /**
   * Performs multiple RPC calls and collect into a `BlockData` object.
   *
   * @param hash block hash to fetch
   */
  getBlockData(hash: Hash): Promise<BlockData>

  /**
   * calls the rpc endpoint to make sure it's alive
   */
  ping(): Promise<void>

  /**
   * Disconnects from the node
   */
  stop(): Promise<void>
}
