import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * Refund the Submission Deposit for a closed referendum back to the depositor.
 * 
 * - `origin`: must be `Signed` or `Root`.
 * - `index`: The index of a closed referendum whose Submission Deposit has not yet been
 *   refunded.
 * 
 * Emits `SubmissionDepositRefunded`.
 */
export type FellowshipReferendaRefundSubmissionDepositCall = {
    index: number,
}

export const FellowshipReferendaRefundSubmissionDepositCall: sts.Type<FellowshipReferendaRefundSubmissionDepositCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * The submission deposit has been refunded.
 */
export type FellowshipReferendaSubmissionDepositRefundedEvent = {
    index: number,
    who: AccountId32,
    amount: bigint,
}

export const FellowshipReferendaSubmissionDepositRefundedEvent: sts.Type<FellowshipReferendaSubmissionDepositRefundedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        who: AccountId32,
        amount: sts.bigint(),
    }
})
