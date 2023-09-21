import {sts} from '../../pallet.support'
import {EraIndex, Balance} from './types'

/**
 *  The era payout has been set; the first balance is the validator-payout; the second is
 *  the remainder from the maximum amount of reward.
 */
export type StakingEraPayoutEvent = [EraIndex, Balance, Balance]

export const StakingEraPayoutEvent: sts.Type<StakingEraPayoutEvent> = sts.tuple(() => EraIndex, Balance, Balance)
