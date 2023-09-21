import {sts} from '../../pallet.support'

/**
 * Control the operation of this pallet.
 * 
 * Dispatch origin must be signed by the [`Config::ControlOrigin`].
 */
export type FastUnstakeControlCall = {
    erasToCheck: number,
}

export const FastUnstakeControlCall: sts.Type<FastUnstakeControlCall> = sts.struct(() => {
    return  {
        erasToCheck: sts.number(),
    }
})

/**
 * A batch of a given size was terminated.
 * 
 * This is always follows by a number of `Unstaked` or `Slashed` events, marking the end
 * of the batch. A new batch will be created upon next block.
 */
export type FastUnstakeBatchFinishedEvent = {
    size: number,
}

export const FastUnstakeBatchFinishedEvent: sts.Type<FastUnstakeBatchFinishedEvent> = sts.struct(() => {
    return  {
        size: sts.number(),
    }
})
