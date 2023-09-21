import {sts} from '../../pallet.support'
import {MultiAddress, AccountId32} from './types'

/**
 * Propose and approve a spend of treasury funds.
 * 
 * - `origin`: Must be `SpendOrigin` with the `Success` value being at least `amount`.
 * - `amount`: The amount to be transferred from the treasury to the `beneficiary`.
 * - `beneficiary`: The destination account for the transfer.
 * 
 * NOTE: For record-keeping purposes, the proposer is deemed to be equivalent to the
 * beneficiary.
 */
export type TreasurySpendCall = {
    amount: bigint,
    beneficiary: MultiAddress,
}

export const TreasurySpendCall: sts.Type<TreasurySpendCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        beneficiary: MultiAddress,
    }
})

/**
 * A new spend proposal has been approved.
 */
export type TreasurySpendApprovedEvent = {
    proposalIndex: number,
    amount: bigint,
    beneficiary: AccountId32,
}

export const TreasurySpendApprovedEvent: sts.Type<TreasurySpendApprovedEvent> = sts.struct(() => {
    return  {
        proposalIndex: sts.number(),
        amount: sts.bigint(),
        beneficiary: AccountId32,
    }
})
