import {sts} from '../../pallet.support'
import {BlockNumber} from './types'

/**
 *  Issue a signal to the consensus engine to forcibly act as though all parachain
 *  blocks in all relay chain blocks up to and including the given number in the current
 *  chain are valid and should be finalized.
 */
export type ParasInitializerForceApproveCall = {
    up_to: BlockNumber,
}

export const ParasInitializerForceApproveCall: sts.Type<ParasInitializerForceApproveCall> = sts.struct(() => {
    return  {
        up_to: BlockNumber,
    }
})
