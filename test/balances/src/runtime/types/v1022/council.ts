import {sts} from '../../pallet.support'
import {Proposal} from './types'

/**
 *  # <weight>
 *  - Bounded storage reads and writes.
 *  - Argument `threshold` has bearing on weight.
 *  # </weight>
 */
export type CouncilProposeCall = {
    threshold: number,
    proposal: Proposal,
}

export const CouncilProposeCall: sts.Type<CouncilProposeCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        proposal: Proposal,
    }
})

/**
 *  Dispatch a proposal from a member using the `Member` origin.
 * 
 *  Origin must be a member of the collective.
 */
export type CouncilExecuteCall = {
    proposal: Proposal,
}

export const CouncilExecuteCall: sts.Type<CouncilExecuteCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
    }
})
