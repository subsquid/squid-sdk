import {sts} from '../../pallet.support'
import {ParaId, ValidationCode, BlockNumber} from './types'

/**
 *  Schedule an upgrade as if it was scheduled in the given relay parent block.
 */
export type ParasForceScheduleCodeUpgradeCall = {
    para: ParaId,
    new_code: ValidationCode,
    relay_parent_number: BlockNumber,
}

export const ParasForceScheduleCodeUpgradeCall: sts.Type<ParasForceScheduleCodeUpgradeCall> = sts.struct(() => {
    return  {
        para: ParaId,
        new_code: ValidationCode,
        relay_parent_number: BlockNumber,
    }
})
