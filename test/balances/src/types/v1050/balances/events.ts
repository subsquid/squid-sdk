import {sts} from '../../support'

/**
 *  Transfer succeeded (from, to, value).
 */
export const BalancesTransferEvent = 
    sts.tuple(sts.bytes(), sts.bytes(), sts.bigint())
