import {sts} from '../../pallet.support'
import {LookupSource, VestingInfo, AccountId, Balance} from './types'

/**
 *  Create a vested transfer. 
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `target`: The account that should be transferred the vested funds.
 *  - `amount`: The amount of funds to transfer and will be vested.
 *  - `schedule`: The vesting schedule attached to the transfer.
 * 
 *  Emits `VestingCreated`.
 * 
 *  # <weight>
 *  - Creates a new storage entry, but is protected by a minimum transfer
 * 	   amount needed to succeed.
 *  # </weight>
 */
export type VestingVestedTransferCall = {
    target: LookupSource,
    schedule: VestingInfo,
}

export const VestingVestedTransferCall: sts.Type<VestingVestedTransferCall> = sts.struct(() => {
    return  {
        target: LookupSource,
        schedule: VestingInfo,
    }
})

/**
 *  Unlock any vested funds of a `target` account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `target`: The account whose vested funds should be unlocked. Must have funds still
 *  locked under this module.
 * 
 *  Emits either `VestingCompleted` or `VestingUpdated`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - Up to one account lookup.
 *  - One balance-lock operation.
 *  - One storage read (codec `O(1)`) and up to one removal.
 *  - One event.
 *  # </weight>
 */
export type VestingVestOtherCall = {
    target: LookupSource,
}

export const VestingVestOtherCall: sts.Type<VestingVestOtherCall> = sts.struct(() => {
    return  {
        target: LookupSource,
    }
})

/**
 *  Unlock any vested funds of the sender account.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have funds still
 *  locked under this module.
 * 
 *  Emits either `VestingCompleted` or `VestingUpdated`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One balance-lock operation.
 *  - One storage read (codec `O(1)`) and up to one removal.
 *  - One event.
 *  # </weight>
 */
export type VestingVestCall = null

export const VestingVestCall: sts.Type<VestingVestCall> = sts.unit()

/**
 *  The amount vested has been updated. This could indicate more funds are available. The
 *  balance given is the amount which is left unvested (and thus locked).
 */
export type VestingVestingUpdatedEvent = [AccountId, Balance]

export const VestingVestingUpdatedEvent: sts.Type<VestingVestingUpdatedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  An account (given) has become fully vested. No further vesting can happen.
 */
export type VestingVestingCompletedEvent = [AccountId]

export const VestingVestingCompletedEvent: sts.Type<VestingVestingCompletedEvent> = sts.tuple(() => AccountId)
