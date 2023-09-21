import {Event, Call, Constant, Storage, sts} from './pallet.support'
import * as v9420 from './types/v9420'
import * as v9340 from './types/v9340'
import * as v9130 from './types/v9130'
import * as v9122 from './types/v9122'
import * as v9111 from './types/v9111'
import * as v9090 from './types/v9090'
import * as v9050 from './types/v9050'
import * as v2028 from './types/v2028'
import * as v2008 from './types/v2008'
import * as v1050 from './types/v1050'
import * as v1032 from './types/v1032'
import * as v1031 from './types/v1031'
import * as v1020 from './types/v1020'

export const events = {
    BalanceSet: new Event(
        'Balances.BalanceSet',
        {
            v1031: v1031.BalancesBalanceSetEvent,
            v9130: v9130.BalancesBalanceSetEvent,
            v9420: v9420.BalancesBalanceSetEvent,
        }
    ),
    Burned: new Event(
        'Balances.Burned',
        {
            v9420: v9420.BalancesBurnedEvent,
        }
    ),
    Deposit: new Event(
        'Balances.Deposit',
        {
            v1032: v1032.BalancesDepositEvent,
            v9130: v9130.BalancesDepositEvent,
        }
    ),
    DustLost: new Event(
        'Balances.DustLost',
        {
            v1050: v1050.BalancesDustLostEvent,
            v9130: v9130.BalancesDustLostEvent,
        }
    ),
    Endowed: new Event(
        'Balances.Endowed',
        {
            v1050: v1050.BalancesEndowedEvent,
            v9130: v9130.BalancesEndowedEvent,
        }
    ),
    Frozen: new Event(
        'Balances.Frozen',
        {
            v9420: v9420.BalancesFrozenEvent,
        }
    ),
    Issued: new Event(
        'Balances.Issued',
        {
            v9420: v9420.BalancesIssuedEvent,
        }
    ),
    Locked: new Event(
        'Balances.Locked',
        {
            v9420: v9420.BalancesLockedEvent,
        }
    ),
    Minted: new Event(
        'Balances.Minted',
        {
            v9420: v9420.BalancesMintedEvent,
        }
    ),
    NewAccount: new Event(
        'Balances.NewAccount',
        {
            v1020: v1020.BalancesNewAccountEvent,
        }
    ),
    ReapedAccount: new Event(
        'Balances.ReapedAccount',
        {
            v1020: v1020.BalancesReapedAccountEvent,
            v1031: v1031.BalancesReapedAccountEvent,
        }
    ),
    Rescinded: new Event(
        'Balances.Rescinded',
        {
            v9420: v9420.BalancesRescindedEvent,
        }
    ),
    ReserveRepatriated: new Event(
        'Balances.ReserveRepatriated',
        {
            v2008: v2008.BalancesReserveRepatriatedEvent,
            v9130: v9130.BalancesReserveRepatriatedEvent,
        }
    ),
    Reserved: new Event(
        'Balances.Reserved',
        {
            v2008: v2008.BalancesReservedEvent,
            v9130: v9130.BalancesReservedEvent,
        }
    ),
    Restored: new Event(
        'Balances.Restored',
        {
            v9420: v9420.BalancesRestoredEvent,
        }
    ),
    Slashed: new Event(
        'Balances.Slashed',
        {
            v9122: v9122.BalancesSlashedEvent,
            v9130: v9130.BalancesSlashedEvent,
        }
    ),
    Suspended: new Event(
        'Balances.Suspended',
        {
            v9420: v9420.BalancesSuspendedEvent,
        }
    ),
    Thawed: new Event(
        'Balances.Thawed',
        {
            v9420: v9420.BalancesThawedEvent,
        }
    ),
    Transfer: new Event(
        'Balances.Transfer',
        {
            v1020: v1020.BalancesTransferEvent,
            v1050: v1050.BalancesTransferEvent,
            v9130: v9130.BalancesTransferEvent,
        }
    ),
    Unlocked: new Event(
        'Balances.Unlocked',
        {
            v9420: v9420.BalancesUnlockedEvent,
        }
    ),
    Unreserved: new Event(
        'Balances.Unreserved',
        {
            v2008: v2008.BalancesUnreservedEvent,
            v9130: v9130.BalancesUnreservedEvent,
        }
    ),
    Upgraded: new Event(
        'Balances.Upgraded',
        {
            v9420: v9420.BalancesUpgradedEvent,
        }
    ),
    Withdraw: new Event(
        'Balances.Withdraw',
        {
            v9122: v9122.BalancesWithdrawEvent,
            v9130: v9130.BalancesWithdrawEvent,
        }
    ),
}

export const calls = {
    force_set_balance: new Call(
        'Balances.force_set_balance',
        {
            v9420: v9420.BalancesForceSetBalanceCall,
        }
    ),
    force_transfer: new Call(
        'Balances.force_transfer',
        {
            v1020: v1020.BalancesForceTransferCall,
            v1050: v1050.BalancesForceTransferCall,
            v2028: v2028.BalancesForceTransferCall,
            v9111: v9111.BalancesForceTransferCall,
        }
    ),
    force_unreserve: new Call(
        'Balances.force_unreserve',
        {
            v9111: v9111.BalancesForceUnreserveCall,
        }
    ),
    set_balance: new Call(
        'Balances.set_balance',
        {
            v1020: v1020.BalancesSetBalanceCall,
            v1050: v1050.BalancesSetBalanceCall,
            v2028: v2028.BalancesSetBalanceCall,
            v9111: v9111.BalancesSetBalanceCall,
        }
    ),
    set_balance_deprecated: new Call(
        'Balances.set_balance_deprecated',
        {
            v9420: v9420.BalancesSetBalanceDeprecatedCall,
        }
    ),
    transfer: new Call(
        'Balances.transfer',
        {
            v1020: v1020.BalancesTransferCall,
            v1050: v1050.BalancesTransferCall,
            v2028: v2028.BalancesTransferCall,
            v9111: v9111.BalancesTransferCall,
        }
    ),
    transfer_all: new Call(
        'Balances.transfer_all',
        {
            v9050: v9050.BalancesTransferAllCall,
            v9111: v9111.BalancesTransferAllCall,
        }
    ),
    transfer_allow_death: new Call(
        'Balances.transfer_allow_death',
        {
            v9420: v9420.BalancesTransferAllowDeathCall,
        }
    ),
    transfer_keep_alive: new Call(
        'Balances.transfer_keep_alive',
        {
            v1020: v1020.BalancesTransferKeepAliveCall,
            v1050: v1050.BalancesTransferKeepAliveCall,
            v2028: v2028.BalancesTransferKeepAliveCall,
            v9111: v9111.BalancesTransferKeepAliveCall,
        }
    ),
    upgrade_accounts: new Call(
        'Balances.upgrade_accounts',
        {
            v9420: v9420.BalancesUpgradeAccountsCall,
        }
    ),
}

export const constants = {
    CreationFee: new Constant(
        'Balances.CreationFee',
        {
            v1020: v1020.BalancesCreationFeeConstant,
        }
    ),
    ExistentialDeposit: new Constant(
        'Balances.ExistentialDeposit',
        {
            v1020: v1020.BalancesExistentialDepositConstant,
        }
    ),
    MaxFreezes: new Constant(
        'Balances.MaxFreezes',
        {
            v9420: v9420.BalancesMaxFreezesConstant,
        }
    ),
    MaxHolds: new Constant(
        'Balances.MaxHolds',
        {
            v9420: v9420.BalancesMaxHoldsConstant,
        }
    ),
    MaxLocks: new Constant(
        'Balances.MaxLocks',
        {
            v9090: v9090.BalancesMaxLocksConstant,
        }
    ),
    MaxReserves: new Constant(
        'Balances.MaxReserves',
        {
            v9090: v9090.BalancesMaxReservesConstant,
        }
    ),
    TransferFee: new Constant(
        'Balances.TransferFee',
        {
            v1020: v1020.BalancesTransferFeeConstant,
        }
    ),
}

export const storage = {
    Account: new Storage(
        'Balances.Account',
        {
            v1050: v1050.BalancesAccountStorage,
            v9420: v9420.BalancesAccountStorage,
        }
    ),
    FreeBalance: new Storage(
        'Balances.FreeBalance',
        {
            v1020: v1020.BalancesFreeBalanceStorage,
        }
    ),
    Freezes: new Storage(
        'Balances.Freezes',
        {
            v9420: v9420.BalancesFreezesStorage,
        }
    ),
    Holds: new Storage(
        'Balances.Holds',
        {
            v9420: v9420.BalancesHoldsStorage,
        }
    ),
    InactiveIssuance: new Storage(
        'Balances.InactiveIssuance',
        {
            v9340: v9340.BalancesInactiveIssuanceStorage,
        }
    ),
    Locks: new Storage(
        'Balances.Locks',
        {
            v1020: v1020.BalancesLocksStorage,
            v1050: v1050.BalancesLocksStorage,
        }
    ),
    ReservedBalance: new Storage(
        'Balances.ReservedBalance',
        {
            v1020: v1020.BalancesReservedBalanceStorage,
        }
    ),
    Reserves: new Storage(
        'Balances.Reserves',
        {
            v9050: v9050.BalancesReservesStorage,
        }
    ),
    StorageVersion: new Storage(
        'Balances.StorageVersion',
        {
            v1050: v1050.BalancesStorageVersionStorage,
            v9111: v9111.BalancesStorageVersionStorage,
        }
    ),
    TotalIssuance: new Storage(
        'Balances.TotalIssuance',
        {
            v1020: v1020.BalancesTotalIssuanceStorage,
        }
    ),
    Vesting: new Storage(
        'Balances.Vesting',
        {
            v1020: v1020.BalancesVestingStorage,
        }
    ),
}

export default {events, calls, constants, storage}
