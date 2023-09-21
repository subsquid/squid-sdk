import {sts} from '../../pallet.support'
import {Keys, SessionIndex} from './types'

/**
 *  Sets the session key(s) of the function caller to `key`.
 *  Allows an account to set its session key prior to becoming a validator.
 *  This doesn't take effect until the next session.
 * 
 *  The dispatch origin of this function must be signed.
 * 
 *  # <weight>
 *  - O(log n) in number of accounts.
 *  - One extra DB entry.
 *  # </weight>
 */
export type SessionSetKeysCall = {
    keys: Keys,
    proof: Bytes,
}

export const SessionSetKeysCall: sts.Type<SessionSetKeysCall> = sts.struct(() => {
    return  {
        keys: Keys,
        proof: sts.bytes(),
    }
})

/**
 *  New session has happened. Note that the argument is the session index, not the block
 *  number as the type might suggest.
 */
export type SessionNewSessionEvent = [SessionIndex]

export const SessionNewSessionEvent: sts.Type<SessionNewSessionEvent> = sts.tuple(() => SessionIndex)
