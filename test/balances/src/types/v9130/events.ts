import {EventType, sts} from '../support'

/**
 * Transfer succeeded.
 */
export const BalancesTransfer = new EventType(
    'Balances.Transfer',
    sts.struct({
        from: sts.bytes(),
        to: sts.bytes(),
        amount: sts.bigint(),
    })
)
