import {EventType, sts} from '../../support'

/**
 *  Transfer succeeded (from, to, value).
 */
export const Transfer = new EventType(
    'Balances.Transfer',
    sts.tuple(sts.bytes(), sts.bytes(), sts.bigint())
)
