import {sts} from '../../support'

/**
 *  Transfer succeeded (from, to, value, fees).
 */
export const BalancesTransferEvent = 
    sts.tuple(sts.bytes(), sts.bytes(), sts.bigint(), sts.bigint())
