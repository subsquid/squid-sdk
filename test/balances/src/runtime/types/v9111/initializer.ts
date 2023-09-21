import {sts} from '../../pallet.support'

/**
 * Issue a signal to the consensus engine to forcibly act as though all parachain
 * blocks in all relay chain blocks up to and including the given number in the current
 * chain are valid and should be finalized.
 */
export type InitializerForceApproveCall = {
    upTo: number,
}

export const InitializerForceApproveCall: sts.Type<InitializerForceApproveCall> = sts.struct(() => {
    return  {
        upTo: sts.number(),
    }
})
