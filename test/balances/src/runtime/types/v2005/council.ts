import {sts} from '../../pallet.support'
import {AccountId, MemberCount, Proposal, Hash, DispatchResult} from './types'

/**
 *  Set the collective's membership.
 * 
 *  - `new_members`: The new member list. Be nice to the chain and provide it sorted.
 *  - `prime`: The prime member whose vote sets the default.
 *  - `old_count`: The upper bound for the previous number of members in storage.
 *                 Used for weight estimation.
 * 
 *  Requires root origin.
 * 
 *  NOTE: Does not enforce the expected `MAX_MEMBERS` limit on the amount of members, but
 *        the weight estimations rely on it to estimate dispatchable weight.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(MP + N)` where:
 *    - `M` old-members-count (code- and governance-bounded)
 *    - `N` new-members-count (code- and governance-bounded)
 *    - `P` proposals-count (code-bounded)
 *  - DB:
 *    - 1 storage mutation (codec `O(M)` read, `O(N)` write) for reading and writing the members
 *    - 1 storage read (codec `O(P)`) for reading the proposals
 *    - `P` storage mutations (codec `O(M)`) for updating the votes for each proposal
 *    - 1 storage write (codec `O(1)`) for deleting the old `prime` and setting the new one
 *  # </weight>
 */
export type CouncilSetMembersCall = {
    new_members: AccountId[],
    prime?: (AccountId | undefined),
    old_count: MemberCount,
}

export const CouncilSetMembersCall: sts.Type<CouncilSetMembersCall> = sts.struct(() => {
    return  {
        new_members: sts.array(() => AccountId),
        prime: sts.option(() => AccountId),
        old_count: MemberCount,
    }
})

/**
 *  Add a new proposal to either be voted on or executed directly.
 * 
 *  Requires the sender to be member.
 * 
 *  `threshold` determines whether `proposal` is executed directly (`threshold < 2`)
 *  or put up for voting.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(B + M + P1)` or `O(B + M + P2)` where:
 *    - `B` is `proposal` size in bytes (length-fee-bounded)
 *    - `M` is members-count (code- and governance-bounded)
 *    - branching is influenced by `threshold` where:
 *      - `P1` is proposal execution complexity (`threshold < 2`)
 *      - `P2` is proposals-count (code-bounded) (`threshold >= 2`)
 *  - DB:
 *    - 1 storage read `is_member` (codec `O(M)`)
 *    - 1 storage read `ProposalOf::contains_key` (codec `O(1)`)
 *    - DB accesses influenced by `threshold`:
 *      - EITHER storage accesses done by `proposal` (`threshold < 2`)
 *      - OR proposal insertion (`threshold <= 2`)
 *        - 1 storage mutation `Proposals` (codec `O(P2)`)
 *        - 1 storage mutation `ProposalCount` (codec `O(1)`)
 *        - 1 storage write `ProposalOf` (codec `O(B)`)
 *        - 1 storage write `Voting` (codec `O(M)`)
 *    - 1 event
 *  # </weight>
 */
export type CouncilProposeCall = {
    threshold: number,
    proposal: Proposal,
    length_bound: number,
}

export const CouncilProposeCall: sts.Type<CouncilProposeCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        proposal: Proposal,
        length_bound: sts.number(),
    }
})

/**
 *  Dispatch a proposal from a member using the `Member` origin.
 * 
 *  Origin must be a member of the collective.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(M + P)` where `M` members-count (code-bounded) and `P` complexity of dispatching `proposal`
 *  - DB: 1 read (codec `O(M)`) + DB access of `proposal`
 *  - 1 event
 *  # </weight>
 */
export type CouncilExecuteCall = {
    proposal: Proposal,
    length_bound: number,
}

export const CouncilExecuteCall: sts.Type<CouncilExecuteCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
        length_bound: sts.number(),
    }
})

/**
 *  Disapprove a proposal, close, and remove it from the system, regardless of its current state.
 * 
 *  Must be called by the Root origin.
 * 
 *  Parameters:
 *  * `proposal_hash`: The hash of the proposal that should be disapproved.
 * 
 *  # <weight>
 *  Complexity: O(P) where P is the number of max proposals
 *  Base Weight: .49 * P
 *  DB Weight:
 *  * Reads: Proposals
 *  * Writes: Voting, Proposals, ProposalOf
 *  # </weight>
 */
export type CouncilDisapproveProposalCall = {
    proposal_hash: Hash,
}

export const CouncilDisapproveProposalCall: sts.Type<CouncilDisapproveProposalCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
    }
})

/**
 *  Close a vote that is either approved, disapproved or whose voting period has ended.
 * 
 *  May be called by any signed account in order to finish voting and close the proposal.
 * 
 *  If called before the end of the voting period it will only close the vote if it is
 *  has enough votes to be approved or disapproved.
 * 
 *  If called after the end of the voting period abstentions are counted as rejections
 *  unless there is a prime member set and the prime member cast an approval.
 * 
 *  + `proposal_weight_bound`: The maximum amount of weight consumed by executing the closed proposal.
 *  + `length_bound`: The upper bound for the length of the proposal in storage. Checked via
 *                    `storage::read` so it is `size_of::<u32>() == 4` larger than the pure length.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(B + M + P1 + P2)` where:
 *    - `B` is `proposal` size in bytes (length-fee-bounded)
 *    - `M` is members-count (code- and governance-bounded)
 *    - `P1` is the complexity of `proposal` preimage.
 *    - `P2` is proposal-count (code-bounded)
 *  - DB:
 *   - 2 storage reads (`Members`: codec `O(M)`, `Prime`: codec `O(1)`)
 *   - 3 mutations (`Voting`: codec `O(M)`, `ProposalOf`: codec `O(B)`, `Proposals`: codec `O(P2)`)
 *   - any mutations done while executing `proposal` (`P1`)
 *  - up to 3 events
 *  # </weight>
 */
export type CouncilCloseCall = {
    proposal_hash: Hash,
    index: number,
    proposal_weight_bound: bigint,
    length_bound: number,
}

export const CouncilCloseCall: sts.Type<CouncilCloseCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
        index: sts.number(),
        proposal_weight_bound: sts.bigint(),
        length_bound: sts.number(),
    }
})

/**
 *  A single member did some action; `bool` is true if returned without error.
 */
export type CouncilMemberExecutedEvent = [Hash, DispatchResult]

export const CouncilMemberExecutedEvent: sts.Type<CouncilMemberExecutedEvent> = sts.tuple(() => Hash, DispatchResult)

/**
 *  A motion was executed; `bool` is true if returned without error.
 */
export type CouncilExecutedEvent = [Hash, DispatchResult]

export const CouncilExecutedEvent: sts.Type<CouncilExecutedEvent> = sts.tuple(() => Hash, DispatchResult)
