import {EventType, sts} from '../support'

/**
 *  Transfer succeeded (from, to, value, fees).
 */
export const BalancesTransfer = new EventType(
    'Balances.Transfer',
    sts.tuple(sts.bytes(), sts.bytes(), sts.bigint(), sts.bigint())
)
