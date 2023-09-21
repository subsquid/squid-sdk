import {sts} from '../../pallet.support'
import {AccountId32, Perbill} from './types'

/**
 * A slash for the given validator, for the given percentage of their stake, at the given
 * era as been reported.
 */
export type StakingSlashReportedEvent = {
    validator: AccountId32,
    fraction: Perbill,
    slashEra: number,
}

export const StakingSlashReportedEvent: sts.Type<StakingSlashReportedEvent> = sts.struct(() => {
    return  {
        validator: AccountId32,
        fraction: Perbill,
        slashEra: sts.number(),
    }
})
