import {sts} from '../../pallet.support'
import {CandidateHash, DisputeLocation, DisputeResult} from './types'

export type ParasDisputesForceUnfreezeCall = null

export const ParasDisputesForceUnfreezeCall: sts.Type<ParasDisputesForceUnfreezeCall> = sts.unit()

/**
 * A dispute has concluded with supermajority against a candidate.
 * Block authors should no longer build on top of this head and should
 * instead revert the block at the given height. This should be the
 * number of the child of the last known valid block in the chain.
 */
export type ParasDisputesRevertEvent = [number]

export const ParasDisputesRevertEvent: sts.Type<ParasDisputesRevertEvent> = sts.tuple(() => sts.number())

/**
 * A dispute has timed out due to insufficient participation.
 * `\[para id, candidate hash\]`
 */
export type ParasDisputesDisputeTimedOutEvent = [CandidateHash]

export const ParasDisputesDisputeTimedOutEvent: sts.Type<ParasDisputesDisputeTimedOutEvent> = sts.tuple(() => CandidateHash)

/**
 * A dispute has been initiated. \[candidate hash, dispute location\]
 */
export type ParasDisputesDisputeInitiatedEvent = [CandidateHash, DisputeLocation]

export const ParasDisputesDisputeInitiatedEvent: sts.Type<ParasDisputesDisputeInitiatedEvent> = sts.tuple(() => CandidateHash, DisputeLocation)

/**
 * A dispute has concluded for or against a candidate.
 * `\[para id, candidate hash, dispute result\]`
 */
export type ParasDisputesDisputeConcludedEvent = [CandidateHash, DisputeResult]

export const ParasDisputesDisputeConcludedEvent: sts.Type<ParasDisputesDisputeConcludedEvent> = sts.tuple(() => CandidateHash, DisputeResult)
