import {sts} from '../../pallet.support'
import {LookupSource, Proposal} from './types'

/**
 *  Authenticates the sudo key and dispatches a function call with `Signed` origin from
 *  a given account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB write (event).
 *  - Unknown weight of derivative `proposal` execution.
 *  # </weight>
 */
export type SudoSudoAsCall = {
    who: LookupSource,
    proposal: Proposal,
}

export const SudoSudoAsCall: sts.Type<SudoSudoAsCall> = sts.struct(() => {
    return  {
        who: LookupSource,
        proposal: Proposal,
    }
})

/**
 *  Authenticates the sudo key and dispatches a function call with `Root` origin.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB write (event).
 *  - Unknown weight of derivative `proposal` execution.
 *  # </weight>
 */
export type SudoSudoCall = {
    proposal: Proposal,
}

export const SudoSudoCall: sts.Type<SudoSudoCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
    }
})
