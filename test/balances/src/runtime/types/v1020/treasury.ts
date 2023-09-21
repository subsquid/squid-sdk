import {sts} from '../../pallet.support'
import {LookupSource, Balance, ProposalIndex, AccountId} from './types'

/**
 *  Reject a proposed spend. The original deposit will be slashed.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB clear.
 *  # </weight>
 */
export type TreasuryRejectProposalCall = {
    proposal_id: number,
}

export const TreasuryRejectProposalCall: sts.Type<TreasuryRejectProposalCall> = sts.struct(() => {
    return  {
        proposal_id: sts.number(),
    }
})

/**
 *  Put forward a suggestion for spending. A deposit proportional to the value
 *  is reserved and slashed if the proposal is rejected. It is returned once the
 *  proposal is awarded.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB change, one extra DB entry.
 *  # </weight>
 */
export type TreasuryProposeSpendCall = {
    value: bigint,
    beneficiary: LookupSource,
}

export const TreasuryProposeSpendCall: sts.Type<TreasuryProposeSpendCall> = sts.struct(() => {
    return  {
        value: sts.bigint(),
        beneficiary: LookupSource,
    }
})

/**
 *  Approve a proposal. At a later time, the proposal will be allocated to the beneficiary
 *  and the original deposit will be returned.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB change.
 *  # </weight>
 */
export type TreasuryApproveProposalCall = {
    proposal_id: number,
}

export const TreasuryApproveProposalCall: sts.Type<TreasuryApproveProposalCall> = sts.struct(() => {
    return  {
        proposal_id: sts.number(),
    }
})

/**
 *  We have ended a spend period and will now allocate funds.
 */
export type TreasurySpendingEvent = [Balance]

export const TreasurySpendingEvent: sts.Type<TreasurySpendingEvent> = sts.tuple(() => Balance)

/**
 *  Spending has finished; this is the amount that rolls over until next spend.
 */
export type TreasuryRolloverEvent = [Balance]

export const TreasuryRolloverEvent: sts.Type<TreasuryRolloverEvent> = sts.tuple(() => Balance)

/**
 *  New proposal.
 */
export type TreasuryProposedEvent = [ProposalIndex]

export const TreasuryProposedEvent: sts.Type<TreasuryProposedEvent> = sts.tuple(() => ProposalIndex)

/**
 *  Some funds have been deposited.
 */
export type TreasuryDepositEvent = [Balance]

export const TreasuryDepositEvent: sts.Type<TreasuryDepositEvent> = sts.tuple(() => Balance)

/**
 *  Some of our funds have been burnt.
 */
export type TreasuryBurntEvent = [Balance]

export const TreasuryBurntEvent: sts.Type<TreasuryBurntEvent> = sts.tuple(() => Balance)

/**
 *  Some funds have been allocated.
 */
export type TreasuryAwardedEvent = [ProposalIndex, Balance, AccountId]

export const TreasuryAwardedEvent: sts.Type<TreasuryAwardedEvent> = sts.tuple(() => ProposalIndex, Balance, AccountId)
