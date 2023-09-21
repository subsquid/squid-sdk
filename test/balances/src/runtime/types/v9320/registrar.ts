import {sts} from '../../pallet.support'
import {Id, HeadData, ValidationCode} from './types'

/**
 * Set the parachain's current head.
 * 
 * Can be called by Root, the parachain, or the parachain manager if the parachain is unlocked.
 */
export type RegistrarSetCurrentHeadCall = {
    para: Id,
    newHead: HeadData,
}

export const RegistrarSetCurrentHeadCall: sts.Type<RegistrarSetCurrentHeadCall> = sts.struct(() => {
    return  {
        para: Id,
        newHead: HeadData,
    }
})

/**
 * Schedule a parachain upgrade.
 * 
 * Can be called by Root, the parachain, or the parachain manager if the parachain is unlocked.
 */
export type RegistrarScheduleCodeUpgradeCall = {
    para: Id,
    newCode: ValidationCode,
}

export const RegistrarScheduleCodeUpgradeCall: sts.Type<RegistrarScheduleCodeUpgradeCall> = sts.struct(() => {
    return  {
        para: Id,
        newCode: ValidationCode,
    }
})

/**
 * Remove a manager lock from a para. This will allow the manager of a
 * previously locked para to deregister or swap a para without using governance.
 * 
 * Can only be called by the Root origin or the parachain.
 */
export type RegistrarRemoveLockCall = {
    para: Id,
}

export const RegistrarRemoveLockCall: sts.Type<RegistrarRemoveLockCall> = sts.struct(() => {
    return  {
        para: Id,
    }
})

/**
 * Add a manager lock from a para. This will prevent the manager of a
 * para to deregister or swap a para.
 * 
 * Can be called by Root, the parachain, or the parachain manager if the parachain is unlocked.
 */
export type RegistrarAddLockCall = {
    para: Id,
}

export const RegistrarAddLockCall: sts.Type<RegistrarAddLockCall> = sts.struct(() => {
    return  {
        para: Id,
    }
})
