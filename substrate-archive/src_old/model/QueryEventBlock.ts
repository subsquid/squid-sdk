// import { BlockNumber } from '@polkadot/types/interfaces';
import { IQueryEvent, QueryEvent } from '.'

import {
  EventRecord,
  SignedBlock,
  RuntimeVersion,
  LastRuntimeUpgradeInfo,
  Extrinsic,
  AccountId,
} from '@polkadot/types/interfaces'

import { u32 } from '@polkadot/types'

export interface QueryEventBlock {
  blockNumber: number
  blockEvents: IQueryEvent[]
}

export interface BlockData {
  events: EventRecord[]
  signedBlock: SignedBlock
  timestamp: number
  lastRuntimeUpgrade: LastRuntimeUpgradeInfo
  runtimeVersion: RuntimeVersion
  validatorId: AccountId
}

export function fromBlockData({
  events,
  signedBlock: { block },
  timestamp,
}: BlockData): QueryEventBlock {
  const extrinsics = block.extrinsics.toArray()
  const blockNumber = block.header.number.toNumber()
  const blockEvents: IQueryEvent[] = events.map(
    (record, index): IQueryEvent => {
      // Extract the phase, event
      const extrinsic = getExtrinsic({ record, extrinsics })
      return new QueryEvent(record, blockNumber, index, timestamp, extrinsic)
    }
  )
  return { blockNumber, blockEvents }
}

/**
 * If the event record was emitted by an extrinsic call,
 * and can extract the extrinsic index by looking at the `phase` object.
 *
 * @param record - event record as decoded by Polkadot API
 * @returns extrinsic index, if the phase is `applyExtrinsic` or `undefined` otherwise
 */
export function getExtrinsicIndex(record: {
  phase: { isApplyExtrinsic: boolean; asApplyExtrinsic: u32 }
}): number | undefined {
  const { phase } = record
  // Try to recover extrinsic: only possible if its right phase, and extrinsics arra is non-empty, the last constraint
  // is needed to avoid events from build config code in genesis, and possibly other cases.
  return phase.isApplyExtrinsic ? phase.asApplyExtrinsic.toNumber() : undefined
}

export function getExtrinsic(eventInBlock: {
  record: {
    phase: { isApplyExtrinsic: boolean; asApplyExtrinsic: u32 }
  }
  extrinsics: Extrinsic[]
}): Extrinsic | undefined {
  const extrinsicIndex = getExtrinsicIndex(eventInBlock.record)

  return getOrUndefined(extrinsicIndex, eventInBlock.extrinsics)
}

/**
 *
 * @param e - event record
 * @returns full event name `${section}.${method}`
 */
export const fullName = (e: { section: string; method: string }): string =>
  `${e.section}.${e.method}`

/**
 * Safely get an element from an array allowing the index and the array itself to be undefined
 */
export function getOrUndefined<T>(
  index: number | undefined,
  from: T[] | undefined
): T | undefined {
  if (index !== undefined && from !== undefined && from.length > index) {
    return from[index]
  }
}
