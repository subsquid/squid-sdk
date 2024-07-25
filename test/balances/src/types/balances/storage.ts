import {sts, Block, Bytes, Option, Result, StorageType, storage, RuntimeCtx, GetStorageType} from '../support'
import * as v1020 from '../v1020'
import * as v1050 from '../v1050'
import * as v9050 from '../v9050'
import * as v9111 from '../v9111'
import * as v9420 from '../v9420'
import * as v1001000 from '../v1001000'

export const totalIssuance = storage('Balances.TotalIssuance', {
    /**
     *  The total units issued in the system.
     */
    v1020: [[], v1020.Balance, 'Default', true] as const,
})

/**
 *  The total units issued in the system.
 */
export type TotalIssuanceV1020 = GetStorageType<[], v1020.Balance, 'Default', true>

export const vesting = storage('Balances.Vesting', {
    /**
     *  Information regarding the vesting of a given account.
     */
    v1020: [[v1020.AccountId], v1020.VestingSchedule, 'Optional', false] as const,
})

/**
 *  Information regarding the vesting of a given account.
 */
export type VestingV1020 = GetStorageType<[key: v1020.AccountId], v1020.VestingSchedule, 'Optional', false>

export const freeBalance = storage('Balances.FreeBalance', {
    /**
     *  The 'free' balance of a given account.
     * 
     *  This is the only balance that matters in terms of most operations on tokens. It
     *  alone is used to determine the balance when in the contract execution environment. When this
     *  balance falls below the value of `ExistentialDeposit`, then the 'current account' is
     *  deleted: specifically `FreeBalance`. Further, the `OnFreeBalanceZero` callback
     *  is invoked, giving a chance to external modules to clean up data associated with
     *  the deleted account.
     * 
     *  `system::AccountNonce` is also deleted if `ReservedBalance` is also zero (it also gets
     *  collapsed to zero if it ever becomes less than `ExistentialDeposit`.
     */
    v1020: [[v1020.AccountId], v1020.Balance, 'Default', false] as const,
})

/**
 *  The 'free' balance of a given account.
 * 
 *  This is the only balance that matters in terms of most operations on tokens. It
 *  alone is used to determine the balance when in the contract execution environment. When this
 *  balance falls below the value of `ExistentialDeposit`, then the 'current account' is
 *  deleted: specifically `FreeBalance`. Further, the `OnFreeBalanceZero` callback
 *  is invoked, giving a chance to external modules to clean up data associated with
 *  the deleted account.
 * 
 *  `system::AccountNonce` is also deleted if `ReservedBalance` is also zero (it also gets
 *  collapsed to zero if it ever becomes less than `ExistentialDeposit`.
 */
export type FreeBalanceV1020 = GetStorageType<[key: v1020.AccountId], v1020.Balance, 'Default', false>

export const reservedBalance = storage('Balances.ReservedBalance', {
    /**
     *  The amount of the balance of a given account that is externally reserved; this can still get
     *  slashed, but gets slashed last of all.
     * 
     *  This balance is a 'reserve' balance that other subsystems use in order to set aside tokens
     *  that are still 'owned' by the account holder, but which are suspendable.
     * 
     *  When this balance falls below the value of `ExistentialDeposit`, then this 'reserve account'
     *  is deleted: specifically, `ReservedBalance`.
     * 
     *  `system::AccountNonce` is also deleted if `FreeBalance` is also zero (it also gets
     *  collapsed to zero if it ever becomes less than `ExistentialDeposit`.)
     */
    v1020: [[v1020.AccountId], v1020.Balance, 'Default', false] as const,
})

/**
 *  The amount of the balance of a given account that is externally reserved; this can still get
 *  slashed, but gets slashed last of all.
 * 
 *  This balance is a 'reserve' balance that other subsystems use in order to set aside tokens
 *  that are still 'owned' by the account holder, but which are suspendable.
 * 
 *  When this balance falls below the value of `ExistentialDeposit`, then this 'reserve account'
 *  is deleted: specifically, `ReservedBalance`.
 * 
 *  `system::AccountNonce` is also deleted if `FreeBalance` is also zero (it also gets
 *  collapsed to zero if it ever becomes less than `ExistentialDeposit`.)
 */
export type ReservedBalanceV1020 = GetStorageType<[key: v1020.AccountId], v1020.Balance, 'Default', false>

export const locks = storage('Balances.Locks', {
    /**
     *  Any liquidity locks on some account balances.
     */
    v1020: [[v1020.AccountId], sts.array(() => v1020.BalanceLock), 'Default', false] as const,
    /**
     *  Any liquidity locks on some account balances.
     *  NOTE: Should only be accessed when setting, changing and freeing a lock.
     */
    v1050: [[v1050.AccountId], sts.array(() => v1050.BalanceLock), 'Default', false] as const,
})

/**
 *  Any liquidity locks on some account balances.
 */
export type LocksV1020 = GetStorageType<[key: v1020.AccountId], v1020.BalanceLock[], 'Default', false>

/**
 *  Any liquidity locks on some account balances.
 *  NOTE: Should only be accessed when setting, changing and freeing a lock.
 */
export type LocksV1050 = GetStorageType<[key: v1050.AccountId], v1050.BalanceLock[], 'Default', false>

export const account = storage('Balances.Account', {
    /**
     *  The balance of an account.
     * 
     *  NOTE: THIS MAY NEVER BE IN EXISTENCE AND YET HAVE A `total().is_zero()`. If the total
     *  is ever zero, then the entry *MUST* be removed.
     * 
     *  NOTE: This is only used in the case that this module is used to store balances.
     */
    v1050: [[v1050.AccountId], v1050.AccountData, 'Default', false] as const,
    /**
     *  The Balances pallet example of storing the balance of an account.
     * 
     *  # Example
     * 
     *  ```nocompile
     *   impl pallet_balances::Config for Runtime {
     *     type AccountStore = StorageMapShim<Self::Account<Runtime>, frame_system::Provider<Runtime>, AccountId, Self::AccountData<Balance>>
     *   }
     *  ```
     * 
     *  You can also store the balance of an account in the `System` pallet.
     * 
     *  # Example
     * 
     *  ```nocompile
     *   impl pallet_balances::Config for Runtime {
     *    type AccountStore = System
     *   }
     *  ```
     * 
     *  But this comes with tradeoffs, storing account balances in the system pallet stores
     *  `frame_system` data alongside the account data contrary to storing account balances in the
     *  `Balances` pallet, which uses a `StorageMap` to store balances data only.
     *  NOTE: This is only used in the case that this pallet is used to store balances.
     */
    v9420: [[v9420.AccountId32], v9420.AccountData, 'Default', true] as const,
})

/**
 *  The balance of an account.
 * 
 *  NOTE: THIS MAY NEVER BE IN EXISTENCE AND YET HAVE A `total().is_zero()`. If the total
 *  is ever zero, then the entry *MUST* be removed.
 * 
 *  NOTE: This is only used in the case that this module is used to store balances.
 */
export type AccountV1050 = GetStorageType<[key: v1050.AccountId], v1050.AccountData, 'Default', false>

/**
 *  The Balances pallet example of storing the balance of an account.
 * 
 *  # Example
 * 
 *  ```nocompile
 *   impl pallet_balances::Config for Runtime {
 *     type AccountStore = StorageMapShim<Self::Account<Runtime>, frame_system::Provider<Runtime>, AccountId, Self::AccountData<Balance>>
 *   }
 *  ```
 * 
 *  You can also store the balance of an account in the `System` pallet.
 * 
 *  # Example
 * 
 *  ```nocompile
 *   impl pallet_balances::Config for Runtime {
 *    type AccountStore = System
 *   }
 *  ```
 * 
 *  But this comes with tradeoffs, storing account balances in the system pallet stores
 *  `frame_system` data alongside the account data contrary to storing account balances in the
 *  `Balances` pallet, which uses a `StorageMap` to store balances data only.
 *  NOTE: This is only used in the case that this pallet is used to store balances.
 */
export type AccountV9420 = GetStorageType<[key: v9420.AccountId32], v9420.AccountData, 'Default', true>

export const storageVersion = storage('Balances.StorageVersion', {
    /**
     *  Storage version of the pallet.
     * 
     *  This is set to v2.0.0 for new networks.
     */
    v1050: [[], v1050.Releases, 'Default', true] as const,
    /**
     *  Storage version of the pallet.
     * 
     *  This is set to v2.0.0 for new networks.
     */
    v9111: [[], v9111.Releases, 'Default', true] as const,
})

/**
 *  Storage version of the pallet.
 * 
 *  This is set to v2.0.0 for new networks.
 */
export type StorageVersionV1050 = GetStorageType<[], v1050.Releases, 'Default', true>

/**
 *  Storage version of the pallet.
 * 
 *  This is set to v2.0.0 for new networks.
 */
export type StorageVersionV9111 = GetStorageType<[], v9111.Releases, 'Default', true>

export const reserves = storage('Balances.Reserves', {
    /**
     *  Named reserves on some account balances.
     */
    v9050: [[v9050.AccountId], sts.array(() => v9050.ReserveData), 'Default', true] as const,
})

/**
 *  Named reserves on some account balances.
 */
export type ReservesV9050 = GetStorageType<[key: v9050.AccountId], v9050.ReserveData[], 'Default', true>

export const inactiveIssuance = storage('Balances.InactiveIssuance', {
    /**
     *  The total units of outstanding deactivated balance in the system.
     */
    v9340: [[], sts.bigint(), 'Default', true] as const,
})

/**
 *  The total units of outstanding deactivated balance in the system.
 */
export type InactiveIssuanceV9340 = GetStorageType<[], bigint, 'Default', true>

export const holds = storage('Balances.Holds', {
    /**
     *  Holds on account balances.
     */
    v9420: [[v9420.AccountId32], sts.array(() => v9420.IdAmount), 'Default', true] as const,
    /**
     *  Holds on account balances.
     */
    v1001000: [[v1001000.AccountId32], sts.array(() => v1001000.IdAmount), 'Default', true] as const,
})

/**
 *  Holds on account balances.
 */
export type HoldsV9420 = GetStorageType<[key: v9420.AccountId32], v9420.IdAmount[], 'Default', true>

/**
 *  Holds on account balances.
 */
export type HoldsV1001000 = GetStorageType<[key: v1001000.AccountId32], v1001000.IdAmount[], 'Default', true>

export const freezes = storage('Balances.Freezes', {
    /**
     *  Freeze locks on account balances.
     */
    v9420: [[v9420.AccountId32], sts.array(() => v9420.Type_544), 'Default', true] as const,
    /**
     *  Freeze locks on account balances.
     */
    v1001000: [[v1001000.AccountId32], sts.array(() => v1001000.Type_566), 'Default', true] as const,
})

/**
 *  Freeze locks on account balances.
 */
export type FreezesV9420 = GetStorageType<[key: v9420.AccountId32], v9420.Type_544[], 'Default', true>

/**
 *  Freeze locks on account balances.
 */
export type FreezesV1001000 = GetStorageType<[key: v1001000.AccountId32], v1001000.Type_566[], 'Default', true>
