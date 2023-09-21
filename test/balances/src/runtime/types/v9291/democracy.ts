import {sts} from '../../pallet.support'
import {MultiAddress, Conviction} from './types'

/**
 * Unlock tokens that have an expired lock.
 * 
 * The dispatch origin of this call must be _Signed_.
 * 
 * - `target`: The account to remove the lock on.
 * 
 * Weight: `O(R)` with R number of vote of target.
 */
export type DemocracyUnlockCall = {
    target: MultiAddress,
}

export const DemocracyUnlockCall: sts.Type<DemocracyUnlockCall> = sts.struct(() => {
    return  {
        target: MultiAddress,
    }
})

/**
 * Remove a vote for a referendum.
 * 
 * If the `target` is equal to the signer, then this function is exactly equivalent to
 * `remove_vote`. If not equal to the signer, then the vote must have expired,
 * either because the referendum was cancelled, because the voter lost the referendum or
 * because the conviction period is over.
 * 
 * The dispatch origin of this call must be _Signed_.
 * 
 * - `target`: The account of the vote to be removed; this account must have voted for
 *   referendum `index`.
 * - `index`: The index of referendum of the vote to be removed.
 * 
 * Weight: `O(R + log R)` where R is the number of referenda that `target` has voted on.
 *   Weight is calculated for the maximum number of vote.
 */
export type DemocracyRemoveOtherVoteCall = {
    target: MultiAddress,
    index: number,
}

export const DemocracyRemoveOtherVoteCall: sts.Type<DemocracyRemoveOtherVoteCall> = sts.struct(() => {
    return  {
        target: MultiAddress,
        index: sts.number(),
    }
})

/**
 * Delegate the voting power (with some given conviction) of the sending account.
 * 
 * The balance delegated is locked for as long as it's delegated, and thereafter for the
 * time appropriate for the conviction's lock period.
 * 
 * The dispatch origin of this call must be _Signed_, and the signing account must either:
 *   - be delegating already; or
 *   - have no voting activity (if there is, then it will need to be removed/consolidated
 *     through `reap_vote` or `unvote`).
 * 
 * - `to`: The account whose voting the `target` account's voting power will follow.
 * - `conviction`: The conviction that will be attached to the delegated votes. When the
 *   account is undelegated, the funds will be locked for the corresponding period.
 * - `balance`: The amount of the account's balance to be used in delegating. This must not
 *   be more than the account's current balance.
 * 
 * Emits `Delegated`.
 * 
 * Weight: `O(R)` where R is the number of referendums the voter delegating to has
 *   voted on. Weight is charged as if maximum votes.
 */
export type DemocracyDelegateCall = {
    to: MultiAddress,
    conviction: Conviction,
    balance: bigint,
}

export const DemocracyDelegateCall: sts.Type<DemocracyDelegateCall> = sts.struct(() => {
    return  {
        to: MultiAddress,
        conviction: Conviction,
        balance: sts.bigint(),
    }
})
