import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * Chill on behalf of the pool.
 * 
 * The dispatch origin of this call must be signed by the pool nominator or the pool
 * root role, same as [`Pallet::nominate`].
 * 
 * This directly forward the call to the staking pallet, on behalf of the pool bonded
 * account.
 */
export type NominationPoolsChillCall = {
    poolId: number,
}

export const NominationPoolsChillCall: sts.Type<NominationPoolsChillCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
    }
})

/**
 * A member has withdrawn from their pool.
 * 
 * The given number of `points` have been dissolved in return of `balance`.
 * 
 * Similar to `Unbonded` event, in the absence of slashing, the ratio of point to balance
 * will be 1.
 */
export type NominationPoolsWithdrawnEvent = {
    member: AccountId32,
    poolId: number,
    balance: bigint,
    points: bigint,
}

export const NominationPoolsWithdrawnEvent: sts.Type<NominationPoolsWithdrawnEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
        poolId: sts.number(),
        balance: sts.bigint(),
        points: sts.bigint(),
    }
})

/**
 * The unbond pool at `era` of pool `pool_id` has been slashed to `balance`.
 */
export type NominationPoolsUnbondingPoolSlashedEvent = {
    poolId: number,
    era: number,
    balance: bigint,
}

export const NominationPoolsUnbondingPoolSlashedEvent: sts.Type<NominationPoolsUnbondingPoolSlashedEvent> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        era: sts.number(),
        balance: sts.bigint(),
    }
})

/**
 * A member has unbonded from their pool.
 * 
 * - `balance` is the corresponding balance of the number of points that has been
 *   requested to be unbonded (the argument of the `unbond` transaction) from the bonded
 *   pool.
 * - `points` is the number of points that are issued as a result of `balance` being
 * dissolved into the corresponding unbonding pool.
 * 
 * In the absence of slashing, these values will match. In the presence of slashing, the
 * number of points that are issued in the unbonding pool will be less than the amount
 * requested to be unbonded.
 */
export type NominationPoolsUnbondedEvent = {
    member: AccountId32,
    poolId: number,
    balance: bigint,
    points: bigint,
}

export const NominationPoolsUnbondedEvent: sts.Type<NominationPoolsUnbondedEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
        poolId: sts.number(),
        balance: sts.bigint(),
        points: sts.bigint(),
    }
})

/**
 * The active balance of pool `pool_id` has been slashed to `balance`.
 */
export type NominationPoolsPoolSlashedEvent = {
    poolId: number,
    balance: bigint,
}

export const NominationPoolsPoolSlashedEvent: sts.Type<NominationPoolsPoolSlashedEvent> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        balance: sts.bigint(),
    }
})
