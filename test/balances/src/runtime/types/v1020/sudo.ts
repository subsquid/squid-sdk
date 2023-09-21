import {sts} from '../../pallet.support'
import {LookupSource, Proposal, AccountId} from './types'

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

/**
 *  Authenticates the current sudo key and sets the given AccountId (`new`) as the new sudo key.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB change.
 *  # </weight>
 */
export type SudoSetKeyCall = {
    new: LookupSource,
}

export const SudoSetKeyCall: sts.Type<SudoSetKeyCall> = sts.struct(() => {
    return  {
        new: LookupSource,
    }
})

/**
 *  A sudo just took place.
 */
export type SudoSudoAsDoneEvent = [boolean]

export const SudoSudoAsDoneEvent: sts.Type<SudoSudoAsDoneEvent> = sts.tuple(() => sts.boolean())

/**
 *  A sudo just took place.
 */
export type SudoSudidEvent = [boolean]

export const SudoSudidEvent: sts.Type<SudoSudidEvent> = sts.tuple(() => sts.boolean())

/**
 *  The sudoer just switched identity; the old key is supplied.
 */
export type SudoKeyChangedEvent = [AccountId]

export const SudoKeyChangedEvent: sts.Type<SudoKeyChangedEvent> = sts.tuple(() => AccountId)
