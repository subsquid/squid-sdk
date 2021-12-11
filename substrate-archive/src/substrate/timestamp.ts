import { Extrinsic } from '@polkadot/types/interfaces'

/**
 * All blocks have timestamp event except for the genesic block.
 * This method looks up `timestamp.set` and reads off the block timestamp
 *
 * @param extrinsics block extrinsics
 * @returns timestamp as set by a `timestamp.set` call
 */
export function getBlockTimestamp(extrinsics: Extrinsic[]): number {
  const ex = extrinsics.find(
    ({ method: { method, section } }) =>
      section === 'timestamp' && method === 'set'
  )
  return ex ? (ex.args[0].toJSON() as number) : 0
}
