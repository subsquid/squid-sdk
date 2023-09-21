import {sts} from '../../pallet.support'
import {AccountId32, ValidatorPrefs} from './types'

/**
 * A validator has set their preferences.
 */
export type StakingValidatorPrefsSetEvent = [AccountId32, ValidatorPrefs]

export const StakingValidatorPrefsSetEvent: sts.Type<StakingValidatorPrefsSetEvent> = sts.tuple(() => AccountId32, ValidatorPrefs)
