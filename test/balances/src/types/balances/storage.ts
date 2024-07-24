import {sts, Block, Bytes, Option, Result, StorageType, storage, RuntimeCtx, GetStorageAtBlockType} from '../support'
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
    v1020: new StorageType('Balances.TotalIssuance', 'Default', [], v1020.Balance) as TotalIssuanceV1020,
})

/**
 *  The total units issued in the system.
 */
export interface TotalIssuanceV1020  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<TotalIssuanceV1020>
    getDefault(block: Block): v1020.Balance
    get(block: Block): Promise<(v1020.Balance | undefined)>
}

export const vesting = storage('Balances.Vesting', {
    /**
     *  Information regarding the vesting of a given account.
     */
    v1020: new StorageType('Balances.Vesting', 'Optional', [v1020.AccountId], v1020.VestingSchedule) as VestingV1020,
})

/**
 *  Information regarding the vesting of a given account.
 */
export interface VestingV1020  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<VestingV1020>
    get(block: Block, key: v1020.AccountId): Promise<(v1020.VestingSchedule | undefined)>
    getMany(block: Block, keys: v1020.AccountId[]): Promise<(v1020.VestingSchedule | undefined)[]>
}

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
    v1020: new StorageType('Balances.FreeBalance', 'Default', [v1020.AccountId], v1020.Balance) as FreeBalanceV1020,
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
export interface FreeBalanceV1020  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<FreeBalanceV1020>
    getDefault(block: Block): v1020.Balance
    get(block: Block, key: v1020.AccountId): Promise<(v1020.Balance | undefined)>
    getMany(block: Block, keys: v1020.AccountId[]): Promise<(v1020.Balance | undefined)[]>
}

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
    v1020: new StorageType('Balances.ReservedBalance', 'Default', [v1020.AccountId], v1020.Balance) as ReservedBalanceV1020,
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
export interface ReservedBalanceV1020  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<ReservedBalanceV1020>
    getDefault(block: Block): v1020.Balance
    get(block: Block, key: v1020.AccountId): Promise<(v1020.Balance | undefined)>
    getMany(block: Block, keys: v1020.AccountId[]): Promise<(v1020.Balance | undefined)[]>
}

export const locks = storage('Balances.Locks', {
    /**
     *  Any liquidity locks on some account balances.
     */
    v1020: new StorageType('Balances.Locks', 'Default', [v1020.AccountId], sts.array(() => v1020.BalanceLock)) as LocksV1020,
    /**
     *  Any liquidity locks on some account balances.
     *  NOTE: Should only be accessed when setting, changing and freeing a lock.
     */
    v1050: new StorageType('Balances.Locks', 'Default', [v1050.AccountId], sts.array(() => v1050.BalanceLock)) as LocksV1050,
})

/**
 *  Any liquidity locks on some account balances.
 */
export interface LocksV1020  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<LocksV1020>
    getDefault(block: Block): v1020.BalanceLock[]
    get(block: Block, key: v1020.AccountId): Promise<(v1020.BalanceLock[] | undefined)>
    getMany(block: Block, keys: v1020.AccountId[]): Promise<(v1020.BalanceLock[] | undefined)[]>
}

/**
 *  Any liquidity locks on some account balances.
 *  NOTE: Should only be accessed when setting, changing and freeing a lock.
 */
export interface LocksV1050  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<LocksV1050>
    getDefault(block: Block): v1050.BalanceLock[]
    get(block: Block, key: v1050.AccountId): Promise<(v1050.BalanceLock[] | undefined)>
    getMany(block: Block, keys: v1050.AccountId[]): Promise<(v1050.BalanceLock[] | undefined)[]>
}

export const account = storage('Balances.Account', {
    /**
     *  The balance of an account.
     * 
     *  NOTE: THIS MAY NEVER BE IN EXISTENCE AND YET HAVE A `total().is_zero()`. If the total
     *  is ever zero, then the entry *MUST* be removed.
     * 
     *  NOTE: This is only used in the case that this module is used to store balances.
     */
    v1050: new StorageType('Balances.Account', 'Default', [v1050.AccountId], v1050.AccountData) as AccountV1050,
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
    v9420: new StorageType('Balances.Account', 'Default', [v9420.AccountId32], v9420.AccountData) as AccountV9420,
})

/**
 *  The balance of an account.
 * 
 *  NOTE: THIS MAY NEVER BE IN EXISTENCE AND YET HAVE A `total().is_zero()`. If the total
 *  is ever zero, then the entry *MUST* be removed.
 * 
 *  NOTE: This is only used in the case that this module is used to store balances.
 */
export interface AccountV1050  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<AccountV1050>
    getDefault(block: Block): v1050.AccountData
    get(block: Block, key: v1050.AccountId): Promise<(v1050.AccountData | undefined)>
    getMany(block: Block, keys: v1050.AccountId[]): Promise<(v1050.AccountData | undefined)[]>
}

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
export interface AccountV9420  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<AccountV9420>
    getDefault(block: Block): v9420.AccountData
    get(block: Block, key: v9420.AccountId32): Promise<(v9420.AccountData | undefined)>
    getMany(block: Block, keys: v9420.AccountId32[]): Promise<(v9420.AccountData | undefined)[]>
    getKeys(block: Block): Promise<v9420.AccountId32[]>
    getKeys(block: Block, key: v9420.AccountId32): Promise<v9420.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block): AsyncIterable<v9420.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block, key: v9420.AccountId32): AsyncIterable<v9420.AccountId32[]>
    getPairs(block: Block): Promise<[k: v9420.AccountId32, v: (v9420.AccountData | undefined)][]>
    getPairs(block: Block, key: v9420.AccountId32): Promise<[k: v9420.AccountId32, v: (v9420.AccountData | undefined)][]>
    getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: v9420.AccountId32, v: (v9420.AccountData | undefined)][]>
    getPairsPaged(pageSize: number, block: Block, key: v9420.AccountId32): AsyncIterable<[k: v9420.AccountId32, v: (v9420.AccountData | undefined)][]>
}

export const storageVersion = storage('Balances.StorageVersion', {
    /**
     *  Storage version of the pallet.
     * 
     *  This is set to v2.0.0 for new networks.
     */
    v1050: new StorageType('Balances.StorageVersion', 'Default', [], v1050.Releases) as StorageVersionV1050,
    /**
     *  Storage version of the pallet.
     * 
     *  This is set to v2.0.0 for new networks.
     */
    v9111: new StorageType('Balances.StorageVersion', 'Default', [], v9111.Releases) as StorageVersionV9111,
})

/**
 *  Storage version of the pallet.
 * 
 *  This is set to v2.0.0 for new networks.
 */
export interface StorageVersionV1050  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<StorageVersionV1050>
    getDefault(block: Block): v1050.Releases
    get(block: Block): Promise<(v1050.Releases | undefined)>
}

/**
 *  Storage version of the pallet.
 * 
 *  This is set to v2.0.0 for new networks.
 */
export interface StorageVersionV9111  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<StorageVersionV9111>
    getDefault(block: Block): v9111.Releases
    get(block: Block): Promise<(v9111.Releases | undefined)>
}

export const reserves = storage('Balances.Reserves', {
    /**
     *  Named reserves on some account balances.
     */
    v9050: new StorageType('Balances.Reserves', 'Default', [v9050.AccountId], sts.array(() => v9050.ReserveData)) as ReservesV9050,
})

/**
 *  Named reserves on some account balances.
 */
export interface ReservesV9050  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<ReservesV9050>
    getDefault(block: Block): v9050.ReserveData[]
    get(block: Block, key: v9050.AccountId): Promise<(v9050.ReserveData[] | undefined)>
    getMany(block: Block, keys: v9050.AccountId[]): Promise<(v9050.ReserveData[] | undefined)[]>
    getKeys(block: Block): Promise<v9050.AccountId[]>
    getKeys(block: Block, key: v9050.AccountId): Promise<v9050.AccountId[]>
    getKeysPaged(pageSize: number, block: Block): AsyncIterable<v9050.AccountId[]>
    getKeysPaged(pageSize: number, block: Block, key: v9050.AccountId): AsyncIterable<v9050.AccountId[]>
    getPairs(block: Block): Promise<[k: v9050.AccountId, v: (v9050.ReserveData[] | undefined)][]>
    getPairs(block: Block, key: v9050.AccountId): Promise<[k: v9050.AccountId, v: (v9050.ReserveData[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: v9050.AccountId, v: (v9050.ReserveData[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block, key: v9050.AccountId): AsyncIterable<[k: v9050.AccountId, v: (v9050.ReserveData[] | undefined)][]>
}

export const inactiveIssuance = storage('Balances.InactiveIssuance', {
    /**
     *  The total units of outstanding deactivated balance in the system.
     */
    v9340: new StorageType('Balances.InactiveIssuance', 'Default', [], sts.bigint()) as InactiveIssuanceV9340,
})

/**
 *  The total units of outstanding deactivated balance in the system.
 */
export interface InactiveIssuanceV9340  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<InactiveIssuanceV9340>
    getDefault(block: Block): bigint
    get(block: Block): Promise<(bigint | undefined)>
}

export const holds = storage('Balances.Holds', {
    /**
     *  Holds on account balances.
     */
    v9420: new StorageType('Balances.Holds', 'Default', [v9420.AccountId32], sts.array(() => v9420.IdAmount)) as HoldsV9420,
    /**
     *  Holds on account balances.
     */
    v1001000: new StorageType('Balances.Holds', 'Default', [v1001000.AccountId32], sts.array(() => v1001000.IdAmount)) as HoldsV1001000,
})

/**
 *  Holds on account balances.
 */
export interface HoldsV9420  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<HoldsV9420>
    getDefault(block: Block): v9420.IdAmount[]
    get(block: Block, key: v9420.AccountId32): Promise<(v9420.IdAmount[] | undefined)>
    getMany(block: Block, keys: v9420.AccountId32[]): Promise<(v9420.IdAmount[] | undefined)[]>
    getKeys(block: Block): Promise<v9420.AccountId32[]>
    getKeys(block: Block, key: v9420.AccountId32): Promise<v9420.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block): AsyncIterable<v9420.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block, key: v9420.AccountId32): AsyncIterable<v9420.AccountId32[]>
    getPairs(block: Block): Promise<[k: v9420.AccountId32, v: (v9420.IdAmount[] | undefined)][]>
    getPairs(block: Block, key: v9420.AccountId32): Promise<[k: v9420.AccountId32, v: (v9420.IdAmount[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: v9420.AccountId32, v: (v9420.IdAmount[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block, key: v9420.AccountId32): AsyncIterable<[k: v9420.AccountId32, v: (v9420.IdAmount[] | undefined)][]>
}

/**
 *  Holds on account balances.
 */
export interface HoldsV1001000  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<HoldsV1001000>
    getDefault(block: Block): v1001000.IdAmount[]
    get(block: Block, key: v1001000.AccountId32): Promise<(v1001000.IdAmount[] | undefined)>
    getMany(block: Block, keys: v1001000.AccountId32[]): Promise<(v1001000.IdAmount[] | undefined)[]>
    getKeys(block: Block): Promise<v1001000.AccountId32[]>
    getKeys(block: Block, key: v1001000.AccountId32): Promise<v1001000.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block): AsyncIterable<v1001000.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block, key: v1001000.AccountId32): AsyncIterable<v1001000.AccountId32[]>
    getPairs(block: Block): Promise<[k: v1001000.AccountId32, v: (v1001000.IdAmount[] | undefined)][]>
    getPairs(block: Block, key: v1001000.AccountId32): Promise<[k: v1001000.AccountId32, v: (v1001000.IdAmount[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: v1001000.AccountId32, v: (v1001000.IdAmount[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block, key: v1001000.AccountId32): AsyncIterable<[k: v1001000.AccountId32, v: (v1001000.IdAmount[] | undefined)][]>
}

export const freezes = storage('Balances.Freezes', {
    /**
     *  Freeze locks on account balances.
     */
    v9420: new StorageType('Balances.Freezes', 'Default', [v9420.AccountId32], sts.array(() => v9420.Type_544)) as FreezesV9420,
    /**
     *  Freeze locks on account balances.
     */
    v1001000: new StorageType('Balances.Freezes', 'Default', [v1001000.AccountId32], sts.array(() => v1001000.Type_566)) as FreezesV1001000,
})

/**
 *  Freeze locks on account balances.
 */
export interface FreezesV9420  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<FreezesV9420>
    getDefault(block: Block): v9420.Type_544[]
    get(block: Block, key: v9420.AccountId32): Promise<(v9420.Type_544[] | undefined)>
    getMany(block: Block, keys: v9420.AccountId32[]): Promise<(v9420.Type_544[] | undefined)[]>
    getKeys(block: Block): Promise<v9420.AccountId32[]>
    getKeys(block: Block, key: v9420.AccountId32): Promise<v9420.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block): AsyncIterable<v9420.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block, key: v9420.AccountId32): AsyncIterable<v9420.AccountId32[]>
    getPairs(block: Block): Promise<[k: v9420.AccountId32, v: (v9420.Type_544[] | undefined)][]>
    getPairs(block: Block, key: v9420.AccountId32): Promise<[k: v9420.AccountId32, v: (v9420.Type_544[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: v9420.AccountId32, v: (v9420.Type_544[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block, key: v9420.AccountId32): AsyncIterable<[k: v9420.AccountId32, v: (v9420.Type_544[] | undefined)][]>
}

/**
 *  Freeze locks on account balances.
 */
export interface FreezesV1001000  {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
    at(block: Block): GetStorageAtBlockType<FreezesV1001000>
    getDefault(block: Block): v1001000.Type_566[]
    get(block: Block, key: v1001000.AccountId32): Promise<(v1001000.Type_566[] | undefined)>
    getMany(block: Block, keys: v1001000.AccountId32[]): Promise<(v1001000.Type_566[] | undefined)[]>
    getKeys(block: Block): Promise<v1001000.AccountId32[]>
    getKeys(block: Block, key: v1001000.AccountId32): Promise<v1001000.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block): AsyncIterable<v1001000.AccountId32[]>
    getKeysPaged(pageSize: number, block: Block, key: v1001000.AccountId32): AsyncIterable<v1001000.AccountId32[]>
    getPairs(block: Block): Promise<[k: v1001000.AccountId32, v: (v1001000.Type_566[] | undefined)][]>
    getPairs(block: Block, key: v1001000.AccountId32): Promise<[k: v1001000.AccountId32, v: (v1001000.Type_566[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block): AsyncIterable<[k: v1001000.AccountId32, v: (v1001000.Type_566[] | undefined)][]>
    getPairsPaged(pageSize: number, block: Block, key: v1001000.AccountId32): AsyncIterable<[k: v1001000.AccountId32, v: (v1001000.Type_566[] | undefined)][]>
}
