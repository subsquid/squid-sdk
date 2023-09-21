import {sts} from '../../pallet.support'
import {MultiAddress} from './types'

/**
 * Submit oneself for candidacy. A fixed amount of deposit is recorded.
 * 
 * All candidates are wiped at the end of the term. They either become a member/runner-up,
 * or leave the system while their deposit is slashed.
 * 
 * The dispatch origin of this call must be signed.
 * 
 * ### Warning
 * 
 * Even if a candidate ends up being a member, they must call [`Call::renounce_candidacy`]
 * to get their deposit back. Losing the spot in an election will always lead to a slash.
 * 
 * # <weight>
 * The number of current candidates must be provided as witness data.
 * # </weight>
 */
export type PhragmenElectionSubmitCandidacyCall = {
    candidateCount: number,
}

export const PhragmenElectionSubmitCandidacyCall: sts.Type<PhragmenElectionSubmitCandidacyCall> = sts.struct(() => {
    return  {
        candidateCount: sts.number(),
    }
})

/**
 * Remove a particular member from the set. This is effective immediately and the bond of
 * the outgoing member is slashed.
 * 
 * If a runner-up is available, then the best runner-up will be removed and replaces the
 * outgoing member. Otherwise, a new phragmen election is started.
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
    hasReplacement: boolean,
}

export const PhragmenElectionRemoveMemberCall: sts.Type<PhragmenElectionRemoveMemberCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
        hasReplacement: sts.boolean(),
    }
})

/**
 * Clean all voters who are defunct (i.e. they do not serve any purpose at all). The
 * deposit of the removed voters are returned.
 * 
 * This is an root function to be used only for cleaning the state.
 * 
 * The dispatch origin of this call must be root.
 * 
 * # <weight>
 * The total number of voters and those that are defunct must be provided as witness data.
 * # </weight>
 */
export type PhragmenElectionCleanDefunctVotersCall = {
    numVoters: number,
    numDefunct: number,
}

export const PhragmenElectionCleanDefunctVotersCall: sts.Type<PhragmenElectionCleanDefunctVotersCall> = sts.struct(() => {
    return  {
        numVoters: sts.number(),
        numDefunct: sts.number(),
    }
})
