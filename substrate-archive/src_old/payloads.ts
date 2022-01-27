import {SubstrateBlock} from "./substrate/data"

/**
 * General block information. Typically, used as a payload for lightweight subscription messages.
 */
export interface BlockPayload {
  height: number
  hash: string
  parentHash: string
  ts: number
  events: { id: string; name: string }[]
  extrinsics: { id: string; name: string }[]
  runtimeVersion: { specVersion?: string }
}

export function toPayload(sb: SubstrateBlock): BlockPayload {
  const runtimeVersion: BlockPayload['runtimeVersion'] = {}
  const spec = (sb.runtimeVersion as any)?.specVersion
  if (spec) {
    runtimeVersion.specVersion = '' + spec
  }
  return {
    height: sb.height,
    hash: sb.hash,
    parentHash: sb.parentHash,
    ts: sb.timestamp,
    events: sb.events,
    extrinsics: sb.extrinsics,
    runtimeVersion,
  }
}
