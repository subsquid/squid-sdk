import {sts} from '../../pallet.support'
import {Id, HeadData, ValidationCode} from './types'

/**
 * Set the storage for the current parachain head data immediately.
 */
export type ParasForceSetCurrentHeadCall = {
    para: Id,
    newHead: HeadData,
}

export const ParasForceSetCurrentHeadCall: sts.Type<ParasForceSetCurrentHeadCall> = sts.struct(() => {
    return  {
        para: Id,
        newHead: HeadData,
    }
})

/**
 * Set the storage for the parachain validation code immediately.
 */
export type ParasForceSetCurrentCodeCall = {
    para: Id,
    newCode: ValidationCode,
}

export const ParasForceSetCurrentCodeCall: sts.Type<ParasForceSetCurrentCodeCall> = sts.struct(() => {
    return  {
        para: Id,
        newCode: ValidationCode,
    }
})

/**
 * Schedule an upgrade as if it was scheduled in the given relay parent block.
 */
export type ParasForceScheduleCodeUpgradeCall = {
    para: Id,
    newCode: ValidationCode,
    relayParentNumber: number,
}

export const ParasForceScheduleCodeUpgradeCall: sts.Type<ParasForceScheduleCodeUpgradeCall> = sts.struct(() => {
    return  {
        para: Id,
        newCode: ValidationCode,
        relayParentNumber: sts.number(),
    }
})

/**
 * Note a new block head for para within the context of the current block.
 */
export type ParasForceNoteNewHeadCall = {
    para: Id,
    newHead: HeadData,
}

export const ParasForceNoteNewHeadCall: sts.Type<ParasForceNoteNewHeadCall> = sts.struct(() => {
    return  {
        para: Id,
        newHead: HeadData,
    }
})
