import {sts} from '../../pallet.support'
import {ParaId, AccountId, BalanceOf, LeasePeriodOf, LeasePeriod, Balance} from './types'

/**
 *  Try to onboard a parachain that has a lease for the current lease period.
 * 
 *  This function can be useful if there was some state issue with a para that should
 *  have onboarded, but was unable to. As long as they have a lease period, we can
 *  let them onboard from here.
 * 
 *  Origin must be signed, but can be called by anyone.
 */
export type SlotsTriggerOnboardCall = {
    para: ParaId,
}

export const SlotsTriggerOnboardCall: sts.Type<SlotsTriggerOnboardCall> = sts.struct(() => {
    return  {
        para: ParaId,
    }
})

/**
 *  Just a hotwire into the `lease_out` call, in case Root wants to force some lease to happen
 *  independently of any other on-chain mechanism to use it.
 * 
 *  Can only be called by the Root origin.
 */
export type SlotsForceLeaseCall = {
    para: ParaId,
    leaser: AccountId,
    amount: BalanceOf,
    period_begin: LeasePeriodOf,
    period_count: LeasePeriodOf,
}

export const SlotsForceLeaseCall: sts.Type<SlotsForceLeaseCall> = sts.struct(() => {
    return  {
        para: ParaId,
        leaser: AccountId,
        amount: BalanceOf,
        period_begin: LeasePeriodOf,
        period_count: LeasePeriodOf,
    }
})

/**
 *  Clear all leases for a Para Id, refunding any deposits back to the original owners.
 * 
 *  Can only be called by the Root origin.
 */
export type SlotsClearAllLeasesCall = {
    para: ParaId,
}

export const SlotsClearAllLeasesCall: sts.Type<SlotsClearAllLeasesCall> = sts.struct(() => {
    return  {
        para: ParaId,
    }
})

/**
 *  An existing parachain won the right to continue.
 *  First balance is the extra amount reseved. Second is the total amount reserved.
 *  \[parachain_id, leaser, period_begin, period_count, extra_reseved, total_amount\]
 */
export type SlotsLeasedEvent = [ParaId, AccountId, LeasePeriod, LeasePeriod, Balance, Balance]

export const SlotsLeasedEvent: sts.Type<SlotsLeasedEvent> = sts.tuple(() => ParaId, AccountId, LeasePeriod, LeasePeriod, Balance, Balance)
