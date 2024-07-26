import {sts, Block, Bytes, Option, Result, EventType, event as event_, RuntimeCtx} from '../support'
import * as v1020 from '../v1020'
import * as v1050 from '../v1050'
import * as v9130 from '../v9130'

export const transfer = event_('Balances.Transfer', {
    /**
     *  Transfer succeeded (from, to, value, fees).
     */
    v1020: sts.tuple([v1020.AccountId, v1020.AccountId, v1020.Balance, v1020.Balance]),
    /**
     *  Transfer succeeded (from, to, value).
     */
    v1050: sts.tuple([v1050.AccountId, v1050.AccountId, v1050.Balance]),
    /**
     * Transfer succeeded.
     */
    v9130: sts.struct({
        from: v9130.AccountId32,
        to: v9130.AccountId32,
        amount: sts.bigint(),
    }),
})
