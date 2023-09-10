import {sts} from '../../support'

/**
 * Transfer succeeded.
 */
export const BalancesTransferEvent = 
    sts.struct({
        from: sts.bytes(),
        to: sts.bytes(),
        amount: sts.bigint(),
    })
