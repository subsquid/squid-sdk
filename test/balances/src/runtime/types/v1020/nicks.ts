import {sts} from '../../pallet.support'
import {LookupSource, AccountId, Balance} from './types'

/**
 *  Set an account's name. The name should be a UTF-8-encoded string by convention, though
 *  we don't check it.
 * 
 *  The name may not be more than `T::MaxLength` bytes, nor less than `T::MinLength` bytes.
 * 
 *  If the account doesn't already have a name, then a fee of `ReservationFee` is reserved
 *  in the account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - O(1).
 *  - At most one balance operation.
 *  - One storage read/write.
 *  - One event.
 *  # </weight>
 */
export type NicksSetNameCall = {
    name: Bytes,
}

export const NicksSetNameCall: sts.Type<NicksSetNameCall> = sts.struct(() => {
    return  {
        name: sts.bytes(),
    }
})

/**
 *  Remove an account's name and take charge of the deposit.
 * 
 *  Fails if `who` has not been named. The deposit is dealt with through `T::Slashed`
 *  imbalance handler.
 * 
 *  The dispatch origin for this call must be _Root_ or match `T::ForceOrigin`.
 * 
 *  # <weight>
 *  - O(1).
 *  - One unbalanced handler (probably a balance transfer)
 *  - One storage read/write.
 *  - One event.
 *  # </weight>
 */
export type NicksKillNameCall = {
    target: LookupSource,
}

export const NicksKillNameCall: sts.Type<NicksKillNameCall> = sts.struct(() => {
    return  {
        target: LookupSource,
    }
})

/**
 *  Set a third-party account's name with no deposit.
 * 
 *  No length checking is done on the name.
 * 
 *  The dispatch origin for this call must be _Root_ or match `T::ForceOrigin`.
 * 
 *  # <weight>
 *  - O(1).
 *  - At most one balance operation.
 *  - One storage read/write.
 *  - One event.
 *  # </weight>
 */
export type NicksForceNameCall = {
    target: LookupSource,
    name: Bytes,
}

export const NicksForceNameCall: sts.Type<NicksForceNameCall> = sts.struct(() => {
    return  {
        target: LookupSource,
        name: sts.bytes(),
    }
})

/**
 *  Clear an account's name and return the deposit. Fails if the account was not named.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - O(1).
 *  - One balance operation.
 *  - One storage read/write.
 *  - One event.
 *  # </weight>
 */
export type NicksClearNameCall = null

export const NicksClearNameCall: sts.Type<NicksClearNameCall> = sts.unit()

/**
 *  A name was set.
 */
export type NicksNameSetEvent = [AccountId]

export const NicksNameSetEvent: sts.Type<NicksNameSetEvent> = sts.tuple(() => AccountId)

/**
 *  A name was removed and the given balance slashed.
 */
export type NicksNameKilledEvent = [AccountId, Balance]

export const NicksNameKilledEvent: sts.Type<NicksNameKilledEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  A name was forcibly set.
 */
export type NicksNameForcedEvent = [AccountId]

export const NicksNameForcedEvent: sts.Type<NicksNameForcedEvent> = sts.tuple(() => AccountId)

/**
 *  A name was cleared, and the given balance returned.
 */
export type NicksNameClearedEvent = [AccountId, Balance]

export const NicksNameClearedEvent: sts.Type<NicksNameClearedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  A name was changed.
 */
export type NicksNameChangedEvent = [AccountId]

export const NicksNameChangedEvent: sts.Type<NicksNameChangedEvent> = sts.tuple(() => AccountId)
