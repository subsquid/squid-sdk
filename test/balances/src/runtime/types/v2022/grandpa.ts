import {sts} from '../../pallet.support'
import {BlockNumber} from './types'

/**
 *  Note that the current authority set of the GRANDPA finality gadget has
 *  stalled. This will trigger a forced authority set change at the beginning
 *  of the next session, to be enacted `delay` blocks after that. The delay
 *  should be high enough to safely assume that the block signalling the
 *  forced change will not be re-orged (e.g. 1000 blocks). The GRANDPA voters
 *  will start the new authority set using the given finalized block as base.
 *  Only callable by root.
 */
export type GrandpaNoteStalledCall = {
    delay: BlockNumber,
    best_finalized_block_number: BlockNumber,
}

export const GrandpaNoteStalledCall: sts.Type<GrandpaNoteStalledCall> = sts.struct(() => {
    return  {
        delay: BlockNumber,
        best_finalized_block_number: BlockNumber,
    }
})
