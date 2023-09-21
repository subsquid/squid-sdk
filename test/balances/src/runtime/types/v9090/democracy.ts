import {sts} from '../../pallet.support'
import {ReferendumIndex, DispatchResult} from './types'

/**
 *  A proposal has been enacted. \[ref_index, result\]
 */
export type DemocracyExecutedEvent = [ReferendumIndex, DispatchResult]

export const DemocracyExecutedEvent: sts.Type<DemocracyExecutedEvent> = sts.tuple(() => ReferendumIndex, DispatchResult)
