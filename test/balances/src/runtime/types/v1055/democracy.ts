import {sts} from '../../pallet.support'
import {AccountVote, ReferendumIndex, AccountId, Conviction, BalanceOf} from './types'

/**
 *  Vote in a referendum. If `vote.is_aye()`, the vote is to enact the proposal;
 *  otherwise it is a vote to keep the status quo.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `ref_index`: The index of the referendum to vote for.
 *  - `vote`: The vote configuration.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One DB change, one DB entry.
 *  # </weight>
 */
export type DemocracyVoteCall = {
    ref_index: number,
    vote: AccountVote,
}

export const DemocracyVoteCall: sts.Type<DemocracyVoteCall> = sts.struct(() => {
    return  {
        ref_index: sts.number(),
        vote: AccountVote,
    }
})

/**
 *  Remove a vote for a referendum.
 * 
 *  If:
 *  - the referendum was cancelled, or
 *  - the referendum is ongoing, or
 *  - the referendum has ended such that
 *    - the vote of the account was in opposition to the result; or
 *    - there was no conviction to the account's vote; or
 *    - the account made a split vote
 *  ...then the vote is removed cleanly and a following call to `unlock` may result in more
 *  funds being available.
 * 
 *  If, however, the referendum has ended and:
 *  - it finished corresponding to the vote of the account, and
 *  - the account made a standard vote with conviction, and
 *  - the lock period of the conviction is not over
 *  ...then the lock will be aggregated into the overall account's lock, which may involve
 *  *overlocking* (where the two locks are combined into a single lock that is the maximum
 *  of both the amount locked and the time is it locked for).
 * 
 *  The dispatch origin of this call must be _Signed_, and the signer must have a vote
 *  registered for referendum `index`.
 * 
 *  - `index`: The index of referendum of the vote to be removed.
 * 
 *  # <weight>
 *  - `O(R + log R)` where R is the number of referenda that `target` has voted on.
 *  # </weight>
 */
export type DemocracyRemoveVoteCall = {
    index: ReferendumIndex,
}

export const DemocracyRemoveVoteCall: sts.Type<DemocracyRemoveVoteCall> = sts.struct(() => {
    return  {
        index: ReferendumIndex,
    }
})

/**
 *  Remove a vote for a referendum.
 * 
 *  If the `target` is equal to the signer, then this function is exactly equivalent to
 *  `remove_vote`. If not equal to the signer, then the vote must have expired,
 *  either because the referendum was cancelled, because the voter lost the referendum or
 *  because the conviction period is over.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `target`: The account of the vote to be removed; this account must have voted for
 *    referendum `index`.
 *  - `index`: The index of referendum of the vote to be removed.
 * 
 *  # <weight>
 *  - `O(R + log R)` where R is the number of referenda that `target` has voted on.
 *  # </weight>
 */
export type DemocracyRemoveOtherVoteCall = {
    target: AccountId,
    index: ReferendumIndex,
}

export const DemocracyRemoveOtherVoteCall: sts.Type<DemocracyRemoveOtherVoteCall> = sts.struct(() => {
    return  {
        target: AccountId,
        index: ReferendumIndex,
    }
})

/**
 *  Vote in a referendum on behalf of a stash. If `vote.is_aye()`, the vote is to enact
 *  the proposal; otherwise it is a vote to keep the status quo.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `ref_index`: The index of the referendum to proxy vote for.
 *  - `vote`: The vote configuration.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One DB change, one DB entry.
 *  # </weight>
 */
export type DemocracyProxyVoteCall = {
    ref_index: number,
    vote: AccountVote,
}

export const DemocracyProxyVoteCall: sts.Type<DemocracyProxyVoteCall> = sts.struct(() => {
    return  {
        ref_index: sts.number(),
        vote: AccountVote,
    }
})

/**
 *  Undelegate the voting power of a proxied account.
 * 
 *  Tokens may be unlocked following once an amount of time consistent with the lock period
 *  of the conviction with which the delegation was issued.
 * 
 *  The dispatch origin of this call must be _Signed_ and the signing account must be a
 *  proxy for some other account which is currently delegating.
 * 
 *  Emits `Undelegated`.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type DemocracyProxyUndelegateCall = null

export const DemocracyProxyUndelegateCall: sts.Type<DemocracyProxyUndelegateCall> = sts.unit()

/**
 *  Remove a proxied vote for a referendum.
 * 
 *  Exactly equivalent to `remove_vote` except that it operates on the account that the
 *  sender is a proxy for.
 * 
 *  The dispatch origin of this call must be _Signed_ and the signing account must be a
 *  proxy for some other account which has a registered vote for the referendum of `index`.
 * 
 *  - `index`: The index of referendum of the vote to be removed.
 * 
 *  # <weight>
 *  - `O(R + log R)` where R is the number of referenda that `target` has voted on.
 *  # </weight>
 */
export type DemocracyProxyRemoveVoteCall = {
    index: ReferendumIndex,
}

export const DemocracyProxyRemoveVoteCall: sts.Type<DemocracyProxyRemoveVoteCall> = sts.struct(() => {
    return  {
        index: ReferendumIndex,
    }
})

/**
 *  Delegate the voting power (with some given conviction) of a proxied account.
 * 
 *  The balance delegated is locked for as long as it's delegated, and thereafter for the
 *  time appropriate for the conviction's lock period.
 * 
 *  The dispatch origin of this call must be _Signed_, and the signing account must have
 *  been set as the proxy account for `target`.
 * 
 *  - `target`: The account whole voting power shall be delegated and whose balance locked.
 *    This account must either:
 *    - be delegating already; or
 *    - have no voting activity (if there is, then it will need to be removed/consolidated
 *      through `reap_vote` or `unvote`).
 *  - `to`: The account whose voting the `target` account's voting power will follow.
 *  - `conviction`: The conviction that will be attached to the delegated votes. When the
 *    account is undelegated, the funds will be locked for the corresponding period.
 *  - `balance`: The amount of the account's balance to be used in delegating. This must
 *    not be more than the account's current balance.
 * 
 *  Emits `Delegated`.
 * 
 *  # <weight>
 *  # </weight>
 */
export type DemocracyProxyDelegateCall = {
    to: AccountId,
    conviction: Conviction,
    balance: BalanceOf,
}

export const DemocracyProxyDelegateCall: sts.Type<DemocracyProxyDelegateCall> = sts.struct(() => {
    return  {
        to: AccountId,
        conviction: Conviction,
        balance: BalanceOf,
    }
})

/**
 *  Delegate the voting power (with some given conviction) of the sending account.
 * 
 *  The balance delegated is locked for as long as it's delegated, and thereafter for the
 *  time appropriate for the conviction's lock period.
 * 
 *  The dispatch origin of this call must be _Signed_, and the signing account must either:
 *    - be delegating already; or
 *    - have no voting activity (if there is, then it will need to be removed/consolidated
 *      through `reap_vote` or `unvote`).
 * 
 *  - `to`: The account whose voting the `target` account's voting power will follow.
 *  - `conviction`: The conviction that will be attached to the delegated votes. When the
 *    account is undelegated, the funds will be locked for the corresponding period.
 *  - `balance`: The amount of the account's balance to be used in delegating. This must
 *    not be more than the account's current balance.
 * 
 *  Emits `Delegated`.
 * 
 *  # <weight>
 *  # </weight>
 */
export type DemocracyDelegateCall = {
    to: AccountId,
    conviction: Conviction,
    balance: BalanceOf,
}

export const DemocracyDelegateCall: sts.Type<DemocracyDelegateCall> = sts.struct(() => {
    return  {
        to: AccountId,
        conviction: Conviction,
        balance: BalanceOf,
    }
})
