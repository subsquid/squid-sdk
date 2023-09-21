import {sts} from '../../pallet.support'
import {LookupSource} from './types'

/**
 *  Report `target` for being an defunct voter. In case of a valid report, the reporter is
 *  rewarded by the bond amount of `target`. Otherwise, the reporter itself is removed and
 *  their bond is slashed.
 * 
 *  A defunct voter is defined to be:
 *    - a voter whose current submitted votes are all invalid. i.e. all of them are no
 *      longer a candidate nor an active member.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(NLogM) given M current candidates and N votes for `target`.
 *  Writes: O(1)
 *  # </weight>
 */
export type ElectionsPhragmenReportDefunctVoterCall = {
    target: LookupSource,
}

export const ElectionsPhragmenReportDefunctVoterCall: sts.Type<ElectionsPhragmenReportDefunctVoterCall> = sts.struct(() => {
    return  {
        target: LookupSource,
    }
})

/**
 *  Remove a particular member from the set. This is effective immediately and the bond of
 *  the outgoing member is slashed.
 * 
 *  If a runner-up is available, then the best runner-up will be removed and replaces the
 *  outgoing member. Otherwise, a new phragmen round is started.
 * 
 *  Note that this does not affect the designated block number of the next election.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(do_phragmen)
 *  Writes: O(do_phragmen)
 *  # </weight>
 */
export type ElectionsPhragmenRemoveMemberCall = {
    who: LookupSource,
}

export const ElectionsPhragmenRemoveMemberCall: sts.Type<ElectionsPhragmenRemoveMemberCall> = sts.struct(() => {
    return  {
        who: LookupSource,
    }
})
