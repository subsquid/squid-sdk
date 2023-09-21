import {sts} from '../../pallet.support'
import {AccountId, Balance, EraIndex} from './types'

/**
 *  A new set of stakers was elected.
 */
export type StakingStakersElectedEvent = null

export const StakingStakersElectedEvent: sts.Type<StakingStakersElectedEvent> = sts.unit()

/**
 *  One validator (and its nominators) has been slashed by the given amount.
 *  \[validator, amount\]
 */
export type StakingSlashedEvent = [AccountId, Balance]

export const StakingSlashedEvent: sts.Type<StakingSlashedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  The nominator has been rewarded by this amount. \[stash, amount\]
 */
export type StakingRewardedEvent = [AccountId, Balance]

export const StakingRewardedEvent: sts.Type<StakingRewardedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  The stakers' rewards are getting paid. \[era_index, validator_stash\]
 */
export type StakingPayoutStartedEvent = [EraIndex, AccountId]

export const StakingPayoutStartedEvent: sts.Type<StakingPayoutStartedEvent> = sts.tuple(() => EraIndex, AccountId)

/**
 *  The era payout has been set; the first balance is the validator-payout; the second is
 *  the remainder from the maximum amount of reward.
 *  \[era_index, validator_payout, remainder\]
 */
export type StakingEraPaidEvent = [EraIndex, Balance, Balance]

export const StakingEraPaidEvent: sts.Type<StakingEraPaidEvent> = sts.tuple(() => EraIndex, Balance, Balance)

/**
 *  An account has stopped participating as either a validator or nominator.
 *  \[stash\]
 */
export type StakingChilledEvent = [AccountId]

export const StakingChilledEvent: sts.Type<StakingChilledEvent> = sts.tuple(() => AccountId)
