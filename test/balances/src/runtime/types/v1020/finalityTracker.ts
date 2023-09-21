import {sts} from '../../pallet.support'

/**
 *  Hint that the author of this block thinks the best finalized
 *  block is the given number.
 */
export type FinalityTrackerFinalHintCall = {
    hint: number,
}

export const FinalityTrackerFinalHintCall: sts.Type<FinalityTrackerFinalHintCall> = sts.struct(() => {
    return  {
        hint: sts.number(),
    }
})
