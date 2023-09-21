import {sts} from '../../pallet.support'
import {AccountId} from './types'

/**
 *  Anull the founding of the society.
 * 
 *  The dispatch origin for this call must be Signed, and the signing account must be both
 *  the `Founder` and the `Head`. This implies that it may only be done when there is one
 *  member.
 * 
 *  # <weight>
 *  - Two storage reads O(1).
 *  - Four storage removals O(1).
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export type SocietyUnfoundCall = null

export const SocietyUnfoundCall: sts.Type<SocietyUnfoundCall> = sts.unit()

/**
 *  Found the society.
 * 
 *  This is done as a discrete action in order to allow for the
 *  module to be included into a running chain and can only be done once.
 * 
 *  The dispatch origin for this call must be from the _FounderSetOrigin_.
 * 
 *  Parameters:
 *  - `founder` - The first member and head of the newly founded society.
 *  - `max_members` - The initial max number of members for the society.
 *  - `rules` - The rules of this society concerning membership.
 * 
 *  # <weight>
 *  - Two storage mutates to set `Head` and `Founder`. O(1)
 *  - One storage write to add the first member to society. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export type SocietyFoundCall = {
    founder: AccountId,
    max_members: number,
    rules: Bytes,
}

export const SocietyFoundCall: sts.Type<SocietyFoundCall> = sts.struct(() => {
    return  {
        founder: AccountId,
        max_members: sts.number(),
        rules: sts.bytes(),
    }
})

/**
 *  Society is unfounded.
 */
export type SocietyUnfoundedEvent = [AccountId]

export const SocietyUnfoundedEvent: sts.Type<SocietyUnfoundedEvent> = sts.tuple(() => AccountId)
