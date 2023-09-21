import {sts} from '../../pallet.support'
import {Vote, Hash, AccountId, Proposal, BlockNumber, ReferendumIndex, Conviction, PropIndex, Balance, VoteThreshold} from './types'

/**
 *  Vote in a referendum. If `vote.is_aye()`, the vote is to enact the proposal;
 *  otherwise it is a vote to keep the status quo.
 * 
 *  # <weight>
 *  - O(1).
 *  - One DB change, one DB entry.
 *  # </weight>
 */
export type DemocracyVoteCall = {
    ref_index: number,
    vote: Vote,
}

export const DemocracyVoteCall: sts.Type<DemocracyVoteCall> = sts.struct(() => {
    return  {
        ref_index: sts.number(),
        vote: Vote,
    }
})

/**
 *  Veto and blacklist the external proposal hash.
 */
export type DemocracyVetoExternalCall = {
    proposal_hash: Hash,
}

export const DemocracyVetoExternalCall: sts.Type<DemocracyVetoExternalCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
    }
})

/**
 *  Undelegate vote.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type DemocracyUndelegateCall = null

export const DemocracyUndelegateCall: sts.Type<DemocracyUndelegateCall> = sts.unit()

/**
 *  Specify a proxy. Called by the stash.
 * 
 *  # <weight>
 *  - One extra DB entry.
 *  # </weight>
 */
export type DemocracySetProxyCall = {
    proxy: AccountId,
}

export const DemocracySetProxyCall: sts.Type<DemocracySetProxyCall> = sts.struct(() => {
    return  {
        proxy: AccountId,
    }
})

/**
 *  Propose a sensitive action to be taken.
 * 
 *  # <weight>
 *  - O(1).
 *  - One DB entry.
 *  # </weight>
 */
export type DemocracySecondCall = {
    proposal: number,
}

export const DemocracySecondCall: sts.Type<DemocracySecondCall> = sts.struct(() => {
    return  {
        proposal: sts.number(),
    }
})

/**
 *  Clear the proxy. Called by the proxy.
 * 
 *  # <weight>
 *  - One DB clear.
 *  # </weight>
 */
export type DemocracyResignProxyCall = null

export const DemocracyResignProxyCall: sts.Type<DemocracyResignProxyCall> = sts.unit()

/**
 *  Clear the proxy. Called by the stash.
 * 
 *  # <weight>
 *  - One DB clear.
 *  # </weight>
 */
export type DemocracyRemoveProxyCall = {
    proxy: AccountId,
}

export const DemocracyRemoveProxyCall: sts.Type<DemocracyRemoveProxyCall> = sts.struct(() => {
    return  {
        proxy: AccountId,
    }
})

/**
 *  Vote in a referendum on behalf of a stash. If `vote.is_aye()`, the vote is to enact
 *  the proposal;  otherwise it is a vote to keep the status quo.
 * 
 *  # <weight>
 *  - O(1).
 *  - One DB change, one DB entry.
 *  # </weight>
 */
export type DemocracyProxyVoteCall = {
    ref_index: number,
    vote: Vote,
}

export const DemocracyProxyVoteCall: sts.Type<DemocracyProxyVoteCall> = sts.struct(() => {
    return  {
        ref_index: sts.number(),
        vote: Vote,
    }
})

/**
 *  Propose a sensitive action to be taken.
 * 
 *  # <weight>
 *  - O(1).
 *  - Two DB changes, one DB entry.
 *  # </weight>
 */
export type DemocracyProposeCall = {
    proposal: Proposal,
    value: bigint,
}

export const DemocracyProposeCall: sts.Type<DemocracyProposeCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
        value: sts.bigint(),
    }
})

/**
 *  Schedule the currently externally-proposed majority-carries referendum to be tabled
 *  immediately. If there is no externally-proposed referendum currently, or if there is one
 *  but it is not a majority-carries referendum then it fails.
 * 
 *  - `proposal_hash`: The hash of the current external proposal.
 *  - `voting_period`: The period that is allowed for voting on this proposal. Increased to
 *    `EmergencyVotingPeriod` if too low.
 *  - `delay`: The number of block after voting has ended in approval and this should be
 *    enacted. This doesn't have a minimum amount.
 */
export type DemocracyFastTrackCall = {
    proposal_hash: Hash,
    voting_period: BlockNumber,
    delay: BlockNumber,
}

export const DemocracyFastTrackCall: sts.Type<DemocracyFastTrackCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
        voting_period: BlockNumber,
        delay: BlockNumber,
    }
})

/**
 *  Schedule a majority-carries referendum to be tabled next once it is legal to schedule
 *  an external referendum.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 */
export type DemocracyExternalProposeMajorityCall = {
    proposal: Proposal,
}

export const DemocracyExternalProposeMajorityCall: sts.Type<DemocracyExternalProposeMajorityCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
    }
})

/**
 *  Schedule a negative-turnout-bias referendum to be tabled next once it is legal to
 *  schedule an external referendum.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 */
export type DemocracyExternalProposeDefaultCall = {
    proposal: Proposal,
}

export const DemocracyExternalProposeDefaultCall: sts.Type<DemocracyExternalProposeDefaultCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
    }
})

/**
 *  Schedule a referendum to be tabled once it is legal to schedule an external
 *  referendum.
 */
export type DemocracyExternalProposeCall = {
    proposal: Proposal,
}

export const DemocracyExternalProposeCall: sts.Type<DemocracyExternalProposeCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
    }
})

/**
 *  Schedule an emergency cancellation of a referendum. Cannot happen twice to the same
 *  referendum.
 */
export type DemocracyEmergencyCancelCall = {
    ref_index: ReferendumIndex,
}

export const DemocracyEmergencyCancelCall: sts.Type<DemocracyEmergencyCancelCall> = sts.struct(() => {
    return  {
        ref_index: ReferendumIndex,
    }
})

/**
 *  Delegate vote.
 * 
 *  # <weight>
 *  - One extra DB entry.
 *  # </weight>
 */
export type DemocracyDelegateCall = {
    to: AccountId,
    conviction: Conviction,
}

export const DemocracyDelegateCall: sts.Type<DemocracyDelegateCall> = sts.struct(() => {
    return  {
        to: AccountId,
        conviction: Conviction,
    }
})

/**
 *  Remove a referendum.
 */
export type DemocracyCancelReferendumCall = {
    ref_index: number,
}

export const DemocracyCancelReferendumCall: sts.Type<DemocracyCancelReferendumCall> = sts.struct(() => {
    return  {
        ref_index: sts.number(),
    }
})

/**
 *  Cancel a proposal queued for enactment.
 */
export type DemocracyCancelQueuedCall = {
    when: number,
    which: number,
    what: number,
}

export const DemocracyCancelQueuedCall: sts.Type<DemocracyCancelQueuedCall> = sts.struct(() => {
    return  {
        when: sts.number(),
        which: sts.number(),
        what: sts.number(),
    }
})

export type DemocracyVetoedEvent = [AccountId, Hash, BlockNumber]

export const DemocracyVetoedEvent: sts.Type<DemocracyVetoedEvent> = sts.tuple(() => AccountId, Hash, BlockNumber)

export type DemocracyUndelegatedEvent = [AccountId]

export const DemocracyUndelegatedEvent: sts.Type<DemocracyUndelegatedEvent> = sts.tuple(() => AccountId)

export type DemocracyTabledEvent = [PropIndex, Balance, AccountId[]]

export const DemocracyTabledEvent: sts.Type<DemocracyTabledEvent> = sts.tuple(() => PropIndex, Balance, sts.array(() => AccountId))

export type DemocracyStartedEvent = [ReferendumIndex, VoteThreshold]

export const DemocracyStartedEvent: sts.Type<DemocracyStartedEvent> = sts.tuple(() => ReferendumIndex, VoteThreshold)

export type DemocracyProposedEvent = [PropIndex, Balance]

export const DemocracyProposedEvent: sts.Type<DemocracyProposedEvent> = sts.tuple(() => PropIndex, Balance)

export type DemocracyPassedEvent = [ReferendumIndex]

export const DemocracyPassedEvent: sts.Type<DemocracyPassedEvent> = sts.tuple(() => ReferendumIndex)

export type DemocracyNotPassedEvent = [ReferendumIndex]

export const DemocracyNotPassedEvent: sts.Type<DemocracyNotPassedEvent> = sts.tuple(() => ReferendumIndex)

export type DemocracyExternalTabledEvent = null

export const DemocracyExternalTabledEvent: sts.Type<DemocracyExternalTabledEvent> = sts.unit()

export type DemocracyExecutedEvent = [ReferendumIndex, boolean]

export const DemocracyExecutedEvent: sts.Type<DemocracyExecutedEvent> = sts.tuple(() => ReferendumIndex, sts.boolean())

export type DemocracyDelegatedEvent = [AccountId, AccountId]

export const DemocracyDelegatedEvent: sts.Type<DemocracyDelegatedEvent> = sts.tuple(() => AccountId, AccountId)

export type DemocracyCancelledEvent = [ReferendumIndex]

export const DemocracyCancelledEvent: sts.Type<DemocracyCancelledEvent> = sts.tuple(() => ReferendumIndex)
