import {sts} from '../../pallet.support'
import {LookupSource, VestingInfo} from './types'

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
 *  - Benchmark: 100.3 + .365 * l µs (min square analysis)
 *  - Using 100 µs fixed. Assuming less than 50 locks on any user, else we may want factor in number of locks.
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
