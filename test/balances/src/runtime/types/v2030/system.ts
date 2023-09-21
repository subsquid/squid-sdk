import {sts} from '../../pallet.support'
import {AccountId, Hash} from './types'

/**
 *  Make some on-chain remark and emit event.
 * 
 *  # <weight>
 *  - `O(b)` where b is the length of the remark.
 *  - 1 event.
 *  # </weight>
 */
export type SystemRemarkWithEventCall = {
    remark: Bytes,
}

export const SystemRemarkWithEventCall: sts.Type<SystemRemarkWithEventCall> = sts.struct(() => {
    return  {
        remark: sts.bytes(),
    }
})

/**
 *  On on-chain remark happened. \[origin, remark_hash\]
 */
export type SystemRemarkedEvent = [AccountId, Hash]

export const SystemRemarkedEvent: sts.Type<SystemRemarkedEvent> = sts.tuple(() => AccountId, Hash)
