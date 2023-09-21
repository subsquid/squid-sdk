import {sts} from '../../pallet.support'

/**
 * A batch was terminated.
 * 
 * This is always follows by a number of `Unstaked` or `Slashed` events, marking the end
 * of the batch. A new batch will be created upon next block.
 */
export type FastUnstakeBatchFinishedEvent = null

export const FastUnstakeBatchFinishedEvent: sts.Type<FastUnstakeBatchFinishedEvent> = sts.unit()

/**
 * A batch was partially checked for the given eras, but the process did not finish.
 */
export type FastUnstakeBatchCheckedEvent = {
    eras: number[],
}

export const FastUnstakeBatchCheckedEvent: sts.Type<FastUnstakeBatchCheckedEvent> = sts.struct(() => {
    return  {
        eras: sts.array(() => sts.number()),
    }
})
