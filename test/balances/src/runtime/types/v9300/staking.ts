import {sts} from '../../pallet.support'
import {AccountId32, ValidatorPrefs} from './types'

/**
 * An account has called `withdraw_unbonded` and removed unbonding chunks worth `Balance`
 * from the unlocking queue.
 */
export type StakingWithdrawnEvent = {
    stash: AccountId32,
    amount: bigint,
}

export const StakingWithdrawnEvent: sts.Type<StakingWithdrawnEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * A validator has set their preferences.
 */
export type StakingValidatorPrefsSetEvent = {
    stash: AccountId32,
    prefs: ValidatorPrefs,
}

export const StakingValidatorPrefsSetEvent: sts.Type<StakingValidatorPrefsSetEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
        prefs: ValidatorPrefs,
    }
})

/**
 * An account has unbonded this amount.
 */
export type StakingUnbondedEvent = {
    stash: AccountId32,
    amount: bigint,
}

export const StakingUnbondedEvent: sts.Type<StakingUnbondedEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * One staker (and potentially its nominators) has been slashed by the given amount.
 */
export type StakingSlashedEvent = {
    staker: AccountId32,
    amount: bigint,
}

export const StakingSlashedEvent: sts.Type<StakingSlashedEvent> = sts.struct(() => {
    return  {
        staker: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * The nominator has been rewarded by this amount.
 */
export type StakingRewardedEvent = {
    stash: AccountId32,
    amount: bigint,
}

export const StakingRewardedEvent: sts.Type<StakingRewardedEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * The stakers' rewards are getting paid.
 */
export type StakingPayoutStartedEvent = {
    eraIndex: number,
    validatorStash: AccountId32,
}

export const StakingPayoutStartedEvent: sts.Type<StakingPayoutStartedEvent> = sts.struct(() => {
    return  {
        eraIndex: sts.number(),
        validatorStash: AccountId32,
    }
})

/**
 * An old slashing report from a prior era was discarded because it could
 * not be processed.
 */
export type StakingOldSlashingReportDiscardedEvent = {
    sessionIndex: number,
}

export const StakingOldSlashingReportDiscardedEvent: sts.Type<StakingOldSlashingReportDiscardedEvent> = sts.struct(() => {
    return  {
        sessionIndex: sts.number(),
    }
})

/**
 * A nominator has been kicked from a validator.
 */
export type StakingKickedEvent = {
    nominator: AccountId32,
    stash: AccountId32,
}

export const StakingKickedEvent: sts.Type<StakingKickedEvent> = sts.struct(() => {
    return  {
        nominator: AccountId32,
        stash: AccountId32,
    }
})

/**
 * The era payout has been set; the first balance is the validator-payout; the second is
 * the remainder from the maximum amount of reward.
 */
export type StakingEraPaidEvent = {
    eraIndex: number,
    validatorPayout: bigint,
    remainder: bigint,
}

export const StakingEraPaidEvent: sts.Type<StakingEraPaidEvent> = sts.struct(() => {
    return  {
        eraIndex: sts.number(),
        validatorPayout: sts.bigint(),
        remainder: sts.bigint(),
    }
})

/**
 * An account has stopped participating as either a validator or nominator.
 */
export type StakingChilledEvent = {
    stash: AccountId32,
}

export const StakingChilledEvent: sts.Type<StakingChilledEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
    }
})

/**
 * An account has bonded this amount. \[stash, amount\]
 * 
 * NOTE: This event is only emitted when funds are bonded via a dispatchable. Notably,
 * it will not be emitted for staking rewards when they are added to stake.
 */
export type StakingBondedEvent = {
    stash: AccountId32,
    amount: bigint,
}

export const StakingBondedEvent: sts.Type<StakingBondedEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
        amount: sts.bigint(),
    }
})
