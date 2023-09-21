import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * A member has unbonded from their pool.
 * 
 * - `balance` is the corresponding balance of the number of points that has been
 *   requested to be unbonded (the argument of the `unbond` transaction) from the bonded
 *   pool.
 * - `points` is the number of points that are issued as a result of `balance` being
 * dissolved into the corresponding unbonding pool.
 * - `era` is the era in which the balance will be unbonded.
 * In the absence of slashing, these values will match. In the presence of slashing, the
 * number of points that are issued in the unbonding pool will be less than the amount
 * requested to be unbonded.
 */
export type NominationPoolsUnbondedEvent = {
    member: AccountId32,
    poolId: number,
    balance: bigint,
    points: bigint,
    era: number,
}

export const NominationPoolsUnbondedEvent: sts.Type<NominationPoolsUnbondedEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
        poolId: sts.number(),
        balance: sts.bigint(),
        points: sts.bigint(),
        era: sts.number(),
    }
})
