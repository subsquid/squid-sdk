import {sts} from '../../pallet.support'
import {AccountId, Balance} from './types'

/**
 *  An account has called `withdraw_unbonded` and removed unbonding chunks worth `Balance`
 *  from the unlocking queue.
 */
export type StakingWithdrawnEvent = [AccountId, Balance]

export const StakingWithdrawnEvent: sts.Type<StakingWithdrawnEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  An account has unbonded this amount.
 */
export type StakingUnbondedEvent = [AccountId, Balance]

export const StakingUnbondedEvent: sts.Type<StakingUnbondedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  An account has bonded this amount.
 * 
 *  NOTE: This event is only emitted when funds are bonded via a dispatchable. Notably,
 *  it will not be emitted for staking rewards when they are added to stake.
 */
export type StakingBondedEvent = [AccountId, Balance]

export const StakingBondedEvent: sts.Type<StakingBondedEvent> = sts.tuple(() => AccountId, Balance)
