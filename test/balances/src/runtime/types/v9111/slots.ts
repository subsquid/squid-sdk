import {sts} from '../../pallet.support'
import {Id, AccountId32} from './types'

/**
 * Just a connect into the `lease_out` call, in case Root wants to force some lease to happen
 * independently of any other on-chain mechanism to use it.
 * 
 * Can only be called by the Root origin.
 */
export type SlotsForceLeaseCall = {
    para: Id,
    leaser: AccountId32,
    amount: bigint,
    periodBegin: number,
    periodCount: number,
}

export const SlotsForceLeaseCall: sts.Type<SlotsForceLeaseCall> = sts.struct(() => {
    return  {
        para: Id,
        leaser: AccountId32,
        amount: sts.bigint(),
        periodBegin: sts.number(),
        periodCount: sts.number(),
    }
})
