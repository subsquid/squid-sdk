import {sts} from '../../pallet.support'
import {NextConfigDescriptor} from './types'

/**
 *  Plan an epoch config change. The epoch config change is recorded and will be enacted on
 *  the next call to `enact_epoch_change`. The config will be activated one epoch after.
 *  Multiple calls to this method will replace any existing planned config change that had
 *  not been enacted yet.
 */
export type BabePlanConfigChangeCall = {
    config: NextConfigDescriptor,
}

export const BabePlanConfigChangeCall: sts.Type<BabePlanConfigChangeCall> = sts.struct(() => {
    return  {
        config: NextConfigDescriptor,
    }
})
