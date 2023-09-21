import {sts} from '../../pallet.support'
import {CandidateReceipt, HeadData, CoreIndex, GroupIndex} from './types'

/**
 *  A candidate timed out. [candidate, head_data]
 */
export type ParasInclusionCandidateTimedOutEvent = [CandidateReceipt, HeadData, CoreIndex]

export const ParasInclusionCandidateTimedOutEvent: sts.Type<ParasInclusionCandidateTimedOutEvent> = sts.tuple(() => CandidateReceipt, HeadData, CoreIndex)

/**
 *  A candidate was included. [candidate, head_data]
 */
export type ParasInclusionCandidateIncludedEvent = [CandidateReceipt, HeadData, CoreIndex, GroupIndex]

export const ParasInclusionCandidateIncludedEvent: sts.Type<ParasInclusionCandidateIncludedEvent> = sts.tuple(() => CandidateReceipt, HeadData, CoreIndex, GroupIndex)

/**
 *  A candidate was backed. [candidate, head_data]
 */
export type ParasInclusionCandidateBackedEvent = [CandidateReceipt, HeadData, CoreIndex, GroupIndex]

export const ParasInclusionCandidateBackedEvent: sts.Type<ParasInclusionCandidateBackedEvent> = sts.tuple(() => CandidateReceipt, HeadData, CoreIndex, GroupIndex)
