import {sts} from '../../pallet.support'
import {LookupSource, AccountId} from './types'

/**
 *  Remove a particular member from the set. This is effective immediately and the bond of
 *  the outgoing member is slashed.
 * 
 *  If a runner-up is available, then the best runner-up will be removed and replaces the
 *  outgoing member. Otherwise, a new phragmen election is started.
 * 
 *  The dispatch origin of this call must be root.
 * 
 *  Note that this does not affect the designated block number of the next election.
 * 
 *  # <weight>
 *  If we have a replacement, we use a small weight. Else, since this is a root call and
 *  will go into phragmen, we assume full block for now.
 *  # </weight>
 */
export type ElectionsPhragmenRemoveMemberCall = {
    who: LookupSource,
    has_replacement: boolean,
}

export const ElectionsPhragmenRemoveMemberCall: sts.Type<ElectionsPhragmenRemoveMemberCall> = sts.struct(() => {
    return  {
        who: LookupSource,
        has_replacement: sts.boolean(),
    }
})

/**
 *  Clean all voters who are defunct (i.e. they do not serve any purpose at all). The
 *  deposit of the removed voters are returned.
 * 
 *  This is an root function to be used only for cleaning the state.
 * 
 *  The dispatch origin of this call must be root.
 * 
 *  # <weight>
 *  The total number of voters and those that are defunct must be provided as witness data.
 *  # </weight>
 */
export type ElectionsPhragmenCleanDefunctVotersCall = {
    _num_voters: number,
    _num_defunct: number,
}

export const ElectionsPhragmenCleanDefunctVotersCall: sts.Type<ElectionsPhragmenCleanDefunctVotersCall> = sts.struct(() => {
    return  {
        _num_voters: sts.number(),
        _num_defunct: sts.number(),
    }
})

/**
 *  Someone has renounced their candidacy.
 */
export type ElectionsPhragmenRenouncedEvent = [AccountId]

export const ElectionsPhragmenRenouncedEvent: sts.Type<ElectionsPhragmenRenouncedEvent> = sts.tuple(() => AccountId)
