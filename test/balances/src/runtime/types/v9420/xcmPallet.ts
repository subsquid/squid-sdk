import {sts} from '../../pallet.support'

/**
 * Set or unset the global suspension state of the XCM executor.
 * 
 * - `origin`: Must be an origin specified by AdminOrigin.
 * - `suspended`: `true` to suspend, `false` to resume.
 */
export type XcmPalletForceSuspensionCall = {
    suspended: boolean,
}

export const XcmPalletForceSuspensionCall: sts.Type<XcmPalletForceSuspensionCall> = sts.struct(() => {
    return  {
        suspended: sts.boolean(),
    }
})
