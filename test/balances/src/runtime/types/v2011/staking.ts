import {sts} from '../../pallet.support'
import {Percent} from './types'

/**
 *  Scale up the ideal number of validators by a factor.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  Base Weight: 1.717 µs
 *  Read/Write: Validator Count
 *  # </weight>
 */
export type StakingScaleValidatorCountCall = {
    factor: Percent,
}

export const StakingScaleValidatorCountCall: sts.Type<StakingScaleValidatorCountCall> = sts.struct(() => {
    return  {
        factor: Percent,
    }
})

/**
 *  Increments the ideal number of validators.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  Base Weight: 1.717 µs
 *  Read/Write: Validator Count
 *  # </weight>
 */
export type StakingIncreaseValidatorCountCall = {
    additional: number,
}

export const StakingIncreaseValidatorCountCall: sts.Type<StakingIncreaseValidatorCountCall> = sts.struct(() => {
    return  {
        additional: sts.number(),
    }
})
