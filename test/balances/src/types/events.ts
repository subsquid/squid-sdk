import {EventType, sts} from './support'

/**
 *  Transfer succeeded (from, to, value, fees).
 */
export const BalancesTransferEventV1020 = new EventType(
    sts.tuple(sts.bytes(), sts.bytes(), sts.bigint(), sts.bigint())
)

/**
 *  Transfer succeeded (from, to, value).
 */
export const BalancesTransferEventV1050 = new EventType(
    sts.tuple(sts.bytes(), sts.bytes(), sts.bigint())
)

/**
 * Transfer succeeded.
 */
export const BalancesTransferEventV9130 = new EventType(
    sts.struct({
        from: sts.bytes(),
        to: sts.bytes(),
        amount: sts.bigint(),
    })
)
