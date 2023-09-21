import {sts} from '../../pallet.support'
import {ParaId, HeadData, ValidationCode, BlockNumber, SessionIndex} from './types'

/**
 *  Set the storage for the current parachain head data immediately.
 */
export type ParasForceSetCurrentHeadCall = {
    para: ParaId,
    new_head: HeadData,
}

export const ParasForceSetCurrentHeadCall: sts.Type<ParasForceSetCurrentHeadCall> = sts.struct(() => {
    return  {
        para: ParaId,
        new_head: HeadData,
    }
})

/**
 *  Set the storage for the parachain validation code immediately.
 */
export type ParasForceSetCurrentCodeCall = {
    para: ParaId,
    new_code: ValidationCode,
}

export const ParasForceSetCurrentCodeCall: sts.Type<ParasForceSetCurrentCodeCall> = sts.struct(() => {
    return  {
        para: ParaId,
        new_code: ValidationCode,
    }
})

/**
 *  Schedule a code upgrade for block `expected_at`.
 */
export type ParasForceScheduleCodeUpgradeCall = {
    para: ParaId,
    new_code: ValidationCode,
    expected_at: BlockNumber,
}

export const ParasForceScheduleCodeUpgradeCall: sts.Type<ParasForceScheduleCodeUpgradeCall> = sts.struct(() => {
    return  {
        para: ParaId,
        new_code: ValidationCode,
        expected_at: BlockNumber,
    }
})

/**
 *  Put a parachain directly into the next session's action queue.
 *  We can't queue it any sooner than this without going into the
 *  initializer...
 */
export type ParasForceQueueActionCall = {
    para: ParaId,
}

export const ParasForceQueueActionCall: sts.Type<ParasForceQueueActionCall> = sts.struct(() => {
    return  {
        para: ParaId,
    }
})

/**
 *  Note a new block head for para within the context of the current block.
 */
export type ParasForceNoteNewHeadCall = {
    para: ParaId,
    new_head: HeadData,
}

export const ParasForceNoteNewHeadCall: sts.Type<ParasForceNoteNewHeadCall> = sts.struct(() => {
    return  {
        para: ParaId,
        new_head: HeadData,
    }
})

/**
 *  A new head has been noted for a Para. \[para_id\]
 */
export type ParasNewHeadNotedEvent = [ParaId]

export const ParasNewHeadNotedEvent: sts.Type<ParasNewHeadNotedEvent> = sts.tuple(() => ParaId)

/**
 *  Current head has been updated for a Para. \[para_id\]
 */
export type ParasCurrentHeadUpdatedEvent = [ParaId]

export const ParasCurrentHeadUpdatedEvent: sts.Type<ParasCurrentHeadUpdatedEvent> = sts.tuple(() => ParaId)

/**
 *  Current code has been updated for a Para. \[para_id\]
 */
export type ParasCurrentCodeUpdatedEvent = [ParaId]

export const ParasCurrentCodeUpdatedEvent: sts.Type<ParasCurrentCodeUpdatedEvent> = sts.tuple(() => ParaId)

/**
 *  A code upgrade has been scheduled for a Para. \[para_id\]
 */
export type ParasCodeUpgradeScheduledEvent = [ParaId]

export const ParasCodeUpgradeScheduledEvent: sts.Type<ParasCodeUpgradeScheduledEvent> = sts.tuple(() => ParaId)

/**
 *  A para has been queued to execute pending actions. \[para_id\]
 */
export type ParasActionQueuedEvent = [ParaId, SessionIndex]

export const ParasActionQueuedEvent: sts.Type<ParasActionQueuedEvent> = sts.tuple(() => ParaId, SessionIndex)
