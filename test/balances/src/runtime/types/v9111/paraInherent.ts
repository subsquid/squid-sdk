import {sts} from '../../pallet.support'
import {V1InherentData} from './types'

/**
 * Enter the paras inherent. This will process bitfields and backed candidates.
 */
export type ParaInherentEnterCall = {
    data: V1InherentData,
}

export const ParaInherentEnterCall: sts.Type<ParaInherentEnterCall> = sts.struct(() => {
    return  {
        data: V1InherentData,
    }
})
