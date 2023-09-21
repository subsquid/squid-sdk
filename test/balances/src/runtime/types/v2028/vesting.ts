import {sts} from '../../pallet.support'
import {LookupSource, VestingInfo} from './types'

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
 *  - `O(1)`.
 *  - DbWeight: 3 Reads, 3 Writes
 *      - Reads: Vesting Storage, Balances Locks, Target Account, [Sender Account]
 *      - Writes: Vesting Storage, Balances Locks, Target Account, [Sender Account]
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
 *  - DbWeight: 3 Reads, 3 Writes
 *      - Reads: Vesting Storage, Balances Locks, Target Account
 *      - Writes: Vesting Storage, Balances Locks, Target Account
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
 *  Force a vested transfer.
 * 
 *  The dispatch origin for this call must be _Root_.
 * 
 *  - `source`: The account whose funds should be transferred.
 *  - `target`: The account that should be transferred the vested funds.
 *  - `amount`: The amount of funds to transfer and will be vested.
 *  - `schedule`: The vesting schedule attached to the transfer.
 * 
 *  Emits `VestingCreated`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - DbWeight: 4 Reads, 4 Writes
 *      - Reads: Vesting Storage, Balances Locks, Target Account, Source Account
 *      - Writes: Vesting Storage, Balances Locks, Target Account, Source Account
 *  # </weight>
 */
export type VestingForceVestedTransferCall = {
    source: LookupSource,
    target: LookupSource,
    schedule: VestingInfo,
}

export const VestingForceVestedTransferCall: sts.Type<VestingForceVestedTransferCall> = sts.struct(() => {
    return  {
        source: LookupSource,
        target: LookupSource,
        schedule: VestingInfo,
    }
})
