import {sts} from '../../pallet.support'
import {MultiAddress} from './types'

/**
 * Remove a particular member from the set. This is effective immediately and the bond of
 * the outgoing member is slashed.
 * 
 * If a runner-up is available, then the best runner-up will be removed and replaces the
 * outgoing member. Otherwise, if `rerun_election` is `true`, a new phragmen election is
 * started, else, nothing happens.
 * 
 * If `slash_bond` is set to true, the bond of the member being removed is slashed. Else,
 * it is returned.
 * 
 * The dispatch origin of this call must be root.
 * 
 * Note that this does not affect the designated block number of the next election.
 * 
 * # <weight>
 * If we have a replacement, we use a small weight. Else, since this is a root call and
 * will go into phragmen, we assume full block for now.
 * # </weight>
 */
export type PhragmenElectionRemoveMemberCall = {
    who: MultiAddress,
    slashBond: boolean,
    rerunElection: boolean,
}

export const PhragmenElectionRemoveMemberCall: sts.Type<PhragmenElectionRemoveMemberCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
        slashBond: sts.boolean(),
        rerunElection: sts.boolean(),
    }
})
