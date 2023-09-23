import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * Transfer succeeded.
 */
export type BalancesTransferEvent = {
    from: AccountId32,
    to: AccountId32,
    amount: bigint,
}

export const BalancesTransferEvent: sts.Type<BalancesTransferEvent> = sts.struct(() => {
    return {
        from: AccountId32,
        to: AccountId32,
        amount: sts.bigint(),
    }
})
