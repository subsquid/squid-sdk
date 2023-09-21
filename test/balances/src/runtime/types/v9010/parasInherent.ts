import {sts} from '../../pallet.support'
import {ParachainsInherentData} from './types'

/**
 *  Enter the paras inherent. This will process bitfields and backed candidates.
 */
export type ParasInherentEnterCall = {
    data: ParachainsInherentData,
}

export const ParasInherentEnterCall: sts.Type<ParasInherentEnterCall> = sts.struct(() => {
    return  {
        data: ParachainsInherentData,
    }
})
