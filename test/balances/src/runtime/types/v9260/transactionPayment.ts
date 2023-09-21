import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * A transaction fee `actual_fee`, of which `tip` was added to the minimum inclusion fee,
 * has been paid by `who`.
 */
export type TransactionPaymentTransactionFeePaidEvent = {
    who: AccountId32,
    actualFee: bigint,
    tip: bigint,
}

export const TransactionPaymentTransactionFeePaidEvent: sts.Type<TransactionPaymentTransactionFeePaidEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        actualFee: sts.bigint(),
        tip: sts.bigint(),
    }
})
