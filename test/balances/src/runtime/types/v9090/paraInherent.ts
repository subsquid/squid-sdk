import {sts} from '../../pallet.support'
import {ParachainsInherentData} from './types'

/**
 *  Enter the paras inherent. This will process bitfields and backed candidates.
 */
export type ParaInherentEnterCall = {
    data: ParachainsInherentData,
}

export const ParaInherentEnterCall: sts.Type<ParaInherentEnterCall> = sts.struct(() => {
    return  {
        data: ParachainsInherentData,
    }
})
