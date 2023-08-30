import assert from 'assert'
import {EventType, sts} from './support'

/**
 *  Transfer succeeded (from, to, value, fees).
 */
export const BalancesTransferV1020 = new EventType(
    sts.tuple(sts.bytes(), sts.bytes(), sts.bigint(), sts.bigint())
)

/**
 *  Transfer succeeded (from, to, value).
 */
export const BalancesTransferV1050 = new EventType(
    sts.tuple(sts.bytes(), sts.bytes(), sts.bigint())
)

/**
 * Transfer succeeded.
 */
export const BalancesTransferV9130 = new EventType(
    sts.struct({
        from: sts.bytes(),
        to: sts.bytes(),
        amount: sts.bigint(),
    })
)
