import {sts} from '../../pallet.support'
import {Proposal} from './types'

/**
 *  # <weight>
 *  - Bounded storage reads and writes.
 *  - Argument `threshold` has bearing on weight.
 *  # </weight>
 */
export type TechnicalCommitteeProposeCall = {
    threshold: number,
    proposal: Proposal,
}

export const TechnicalCommitteeProposeCall: sts.Type<TechnicalCommitteeProposeCall> = sts.struct(() => {
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
export type TechnicalCommitteeExecuteCall = {
    proposal: Proposal,
}

export const TechnicalCommitteeExecuteCall: sts.Type<TechnicalCommitteeExecuteCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
    }
})
