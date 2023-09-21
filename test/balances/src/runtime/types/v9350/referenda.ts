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
export type ReferendaRefundSubmissionDepositCall = {
    index: number,
}

export const ReferendaRefundSubmissionDepositCall: sts.Type<ReferendaRefundSubmissionDepositCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * The submission deposit has been refunded.
 */
export type ReferendaSubmissionDepositRefundedEvent = {
    index: number,
    who: AccountId32,
    amount: bigint,
}

export const ReferendaSubmissionDepositRefundedEvent: sts.Type<ReferendaSubmissionDepositRefundedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        who: AccountId32,
        amount: sts.bigint(),
    }
})
