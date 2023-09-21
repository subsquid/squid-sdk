import {sts} from '../../pallet.support'
import {Id, AccountId32} from './types'

/**
 * A new `[lease_period]` is beginning.
 */
export type SlotsNewLeasePeriodEvent = {
    leasePeriod: number,
}

export const SlotsNewLeasePeriodEvent: sts.Type<SlotsNewLeasePeriodEvent> = sts.struct(() => {
    return  {
        leasePeriod: sts.number(),
    }
})

/**
 * A para has won the right to a continuous set of lease periods as a parachain.
 * First balance is any extra amount reserved on top of the para's existing deposit.
 * Second balance is the total amount reserved.
 */
export type SlotsLeasedEvent = {
    paraId: Id,
    leaser: AccountId32,
    periodBegin: number,
    periodCount: number,
    extraReserved: bigint,
    totalAmount: bigint,
}

export const SlotsLeasedEvent: sts.Type<SlotsLeasedEvent> = sts.struct(() => {
    return  {
        paraId: Id,
        leaser: AccountId32,
        periodBegin: sts.number(),
        periodCount: sts.number(),
        extraReserved: sts.bigint(),
        totalAmount: sts.bigint(),
    }
})
