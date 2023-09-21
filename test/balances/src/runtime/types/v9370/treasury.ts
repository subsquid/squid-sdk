import {sts} from '../../pallet.support'

/**
 * The inactive funds of the pallet have been updated.
 */
export type TreasuryUpdatedInactiveEvent = {
    reactivated: bigint,
    deactivated: bigint,
}

export const TreasuryUpdatedInactiveEvent: sts.Type<TreasuryUpdatedInactiveEvent> = sts.struct(() => {
    return  {
        reactivated: sts.bigint(),
        deactivated: sts.bigint(),
    }
})
