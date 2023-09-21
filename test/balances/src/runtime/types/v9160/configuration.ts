import {sts} from '../../pallet.support'

/**
 * Set the validation upgrade cooldown.
 */
export type ConfigurationSetValidationUpgradeCooldownCall = {
    new: number,
}

export const ConfigurationSetValidationUpgradeCooldownCall: sts.Type<ConfigurationSetValidationUpgradeCooldownCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 * Set the number of session changes after which a PVF pre-checking voting is rejected.
 */
export type ConfigurationSetPvfVotingTtlCall = {
    new: number,
}

export const ConfigurationSetPvfVotingTtlCall: sts.Type<ConfigurationSetPvfVotingTtlCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 * Enable or disable PVF pre-checking. Consult the field documentation prior executing.
 */
export type ConfigurationSetPvfCheckingEnabledCall = {
    new: boolean,
}

export const ConfigurationSetPvfCheckingEnabledCall: sts.Type<ConfigurationSetPvfCheckingEnabledCall> = sts.struct(() => {
    return  {
        new: sts.boolean(),
    }
})

/**
 * Sets the minimum delay between announcing the upgrade block for a parachain until the
 * upgrade taking place.
 * 
 * See the field documentation for information and constraints for the new value.
 */
export type ConfigurationSetMinimumValidationUpgradeDelayCall = {
    new: number,
}

export const ConfigurationSetMinimumValidationUpgradeDelayCall: sts.Type<ConfigurationSetMinimumValidationUpgradeDelayCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 * Setting this to true will disable consistency checks for the configuration setters.
 * Use with caution.
 */
export type ConfigurationSetBypassConsistencyCheckCall = {
    new: boolean,
}

export const ConfigurationSetBypassConsistencyCheckCall: sts.Type<ConfigurationSetBypassConsistencyCheckCall> = sts.struct(() => {
    return  {
        new: sts.boolean(),
    }
})
