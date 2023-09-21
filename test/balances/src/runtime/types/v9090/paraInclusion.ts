import {sts} from '../../pallet.support'
import {CandidateReceipt, HeadData, CoreIndex, GroupIndex} from './types'

/**
 *  A candidate timed out. `[candidate, head_data]`
 */
export type ParaInclusionCandidateTimedOutEvent = [CandidateReceipt, HeadData, CoreIndex]

export const ParaInclusionCandidateTimedOutEvent: sts.Type<ParaInclusionCandidateTimedOutEvent> = sts.tuple(() => CandidateReceipt, HeadData, CoreIndex)

/**
 *  A candidate was included. `[candidate, head_data]`
 */
export type ParaInclusionCandidateIncludedEvent = [CandidateReceipt, HeadData, CoreIndex, GroupIndex]

export const ParaInclusionCandidateIncludedEvent: sts.Type<ParaInclusionCandidateIncludedEvent> = sts.tuple(() => CandidateReceipt, HeadData, CoreIndex, GroupIndex)

/**
 *  A candidate was backed. `[candidate, head_data]`
 */
export type ParaInclusionCandidateBackedEvent = [CandidateReceipt, HeadData, CoreIndex, GroupIndex]

export const ParaInclusionCandidateBackedEvent: sts.Type<ParaInclusionCandidateBackedEvent> = sts.tuple(() => CandidateReceipt, HeadData, CoreIndex, GroupIndex)
