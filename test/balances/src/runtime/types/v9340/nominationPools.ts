import {sts} from '../../pallet.support'
import {MultiAddress} from './types'

/**
 * Create a new delegation pool with a previously used pool id
 * 
 * # Arguments
 * 
 * same as `create` with the inclusion of
 * * `pool_id` - `A valid PoolId.
 */
export type NominationPoolsCreateWithPoolIdCall = {
    amount: bigint,
    root: MultiAddress,
    nominator: MultiAddress,
    stateToggler: MultiAddress,
    poolId: number,
}

export const NominationPoolsCreateWithPoolIdCall: sts.Type<NominationPoolsCreateWithPoolIdCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        root: MultiAddress,
        nominator: MultiAddress,
        stateToggler: MultiAddress,
        poolId: sts.number(),
    }
})
