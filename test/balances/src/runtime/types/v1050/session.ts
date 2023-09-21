import {sts} from '../../pallet.support'

/**
 *  Removes any session key(s) of the function caller.
 *  This doesn't take effect until the next session.
 * 
 *  The dispatch origin of this function must be signed.
 * 
 *  # <weight>
 *  - O(N) in number of key types.
 *  - Removes N + 1 DB entries.
 *  - Reduces system account refs by one on success.
 *  # </weight>
 */
export type SessionPurgeKeysCall = null

export const SessionPurgeKeysCall: sts.Type<SessionPurgeKeysCall> = sts.unit()
