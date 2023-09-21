import {sts} from '../../pallet.support'
import {V1CandidateReceipt, HeadData, V1CoreIndex, V1GroupIndex} from './types'

/**
 * A candidate timed out. `[candidate, head_data]`
 */
export type ParaInclusionCandidateTimedOutEvent = [V1CandidateReceipt, HeadData, V1CoreIndex]

export const ParaInclusionCandidateTimedOutEvent: sts.Type<ParaInclusionCandidateTimedOutEvent> = sts.tuple(() => V1CandidateReceipt, HeadData, V1CoreIndex)

/**
 * A candidate was included. `[candidate, head_data]`
 */
export type ParaInclusionCandidateIncludedEvent = [V1CandidateReceipt, HeadData, V1CoreIndex, V1GroupIndex]

export const ParaInclusionCandidateIncludedEvent: sts.Type<ParaInclusionCandidateIncludedEvent> = sts.tuple(() => V1CandidateReceipt, HeadData, V1CoreIndex, V1GroupIndex)

/**
 * A candidate was backed. `[candidate, head_data]`
 */
export type ParaInclusionCandidateBackedEvent = [V1CandidateReceipt, HeadData, V1CoreIndex, V1GroupIndex]

export const ParaInclusionCandidateBackedEvent: sts.Type<ParaInclusionCandidateBackedEvent> = sts.tuple(() => V1CandidateReceipt, HeadData, V1CoreIndex, V1GroupIndex)
