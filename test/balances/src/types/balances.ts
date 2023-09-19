import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    BalanceSet: createEvent(
        'Balances.BalanceSet',
        {
            v1031: BalancesBalanceSetEvent,
            v9130: BalancesBalanceSetEvent,
            v9420: BalancesBalanceSetEvent,
        }
    ),
    Burned: createEvent(
        'Balances.Burned',
        {
            v9420: BalancesBurnedEvent,
        }
    ),
    Deposit: createEvent(
        'Balances.Deposit',
        {
            v1032: BalancesDepositEvent,
            v9130: BalancesDepositEvent,
        }
    ),
    DustLost: createEvent(
        'Balances.DustLost',
        {
            v1050: BalancesDustLostEvent,
            v9130: BalancesDustLostEvent,
        }
    ),
    Endowed: createEvent(
        'Balances.Endowed',
        {
            v1050: BalancesEndowedEvent,
            v9130: BalancesEndowedEvent,
        }
    ),
    Frozen: createEvent(
        'Balances.Frozen',
        {
            v9420: BalancesFrozenEvent,
        }
    ),
    Issued: createEvent(
        'Balances.Issued',
        {
            v9420: BalancesIssuedEvent,
        }
    ),
    Locked: createEvent(
        'Balances.Locked',
        {
            v9420: BalancesLockedEvent,
        }
    ),
    Minted: createEvent(
        'Balances.Minted',
        {
            v9420: BalancesMintedEvent,
        }
    ),
    NewAccount: createEvent(
        'Balances.NewAccount',
        {
            v1020: BalancesNewAccountEvent,
        }
    ),
    ReapedAccount: createEvent(
        'Balances.ReapedAccount',
        {
            v1020: BalancesReapedAccountEvent,
            v1031: BalancesReapedAccountEvent,
        }
    ),
    Rescinded: createEvent(
        'Balances.Rescinded',
        {
            v9420: BalancesRescindedEvent,
        }
    ),
    ReserveRepatriated: createEvent(
        'Balances.ReserveRepatriated',
        {
            v2008: BalancesReserveRepatriatedEvent,
            v9130: BalancesReserveRepatriatedEvent,
        }
    ),
    Reserved: createEvent(
        'Balances.Reserved',
        {
            v2008: BalancesReservedEvent,
            v9130: BalancesReservedEvent,
        }
    ),
    Restored: createEvent(
        'Balances.Restored',
        {
            v9420: BalancesRestoredEvent,
        }
    ),
    Slashed: createEvent(
        'Balances.Slashed',
        {
            v9122: BalancesSlashedEvent,
            v9130: BalancesSlashedEvent,
        }
    ),
    Suspended: createEvent(
        'Balances.Suspended',
        {
            v9420: BalancesSuspendedEvent,
        }
    ),
    Thawed: createEvent(
        'Balances.Thawed',
        {
            v9420: BalancesThawedEvent,
        }
    ),
    Transfer: createEvent(
        'Balances.Transfer',
        {
            v1020: BalancesTransferEvent,
            v1050: BalancesTransferEvent,
            v9130: BalancesTransferEvent,
        }
    ),
    Unlocked: createEvent(
        'Balances.Unlocked',
        {
            v9420: BalancesUnlockedEvent,
        }
    ),
    Unreserved: createEvent(
        'Balances.Unreserved',
        {
            v2008: BalancesUnreservedEvent,
            v9130: BalancesUnreservedEvent,
        }
    ),
    Upgraded: createEvent(
        'Balances.Upgraded',
        {
            v9420: BalancesUpgradedEvent,
        }
    ),
    Withdraw: createEvent(
        'Balances.Withdraw',
        {
            v9122: BalancesWithdrawEvent,
            v9130: BalancesWithdrawEvent,
        }
    ),
}

export const calls = {
    force_set_balance: createCall(
        'Balances.force_set_balance',
        {
            v9420: BalancesForceSetBalanceCall,
        }
    ),
    force_transfer: createCall(
        'Balances.force_transfer',
        {
            v1020: BalancesForceTransferCall,
            v1050: BalancesForceTransferCall,
            v2028: BalancesForceTransferCall,
            v9111: BalancesForceTransferCall,
        }
    ),
    force_unreserve: createCall(
        'Balances.force_unreserve',
        {
            v9111: BalancesForceUnreserveCall,
        }
    ),
    set_balance: createCall(
        'Balances.set_balance',
        {
            v1020: BalancesSetBalanceCall,
            v1050: BalancesSetBalanceCall,
            v2028: BalancesSetBalanceCall,
            v9111: BalancesSetBalanceCall,
        }
    ),
    set_balance_deprecated: createCall(
        'Balances.set_balance_deprecated',
        {
            v9420: BalancesSetBalanceDeprecatedCall,
        }
    ),
    transfer: createCall(
        'Balances.transfer',
        {
            v1020: BalancesTransferCall,
            v1050: BalancesTransferCall,
            v2028: BalancesTransferCall,
            v9111: BalancesTransferCall,
        }
    ),
    transfer_all: createCall(
        'Balances.transfer_all',
        {
            v9050: BalancesTransferAllCall,
            v9111: BalancesTransferAllCall,
        }
    ),
    transfer_allow_death: createCall(
        'Balances.transfer_allow_death',
        {
            v9420: BalancesTransferAllowDeathCall,
        }
    ),
    transfer_keep_alive: createCall(
        'Balances.transfer_keep_alive',
        {
            v1020: BalancesTransferKeepAliveCall,
            v1050: BalancesTransferKeepAliveCall,
            v2028: BalancesTransferKeepAliveCall,
            v9111: BalancesTransferKeepAliveCall,
        }
    ),
    upgrade_accounts: createCall(
        'Balances.upgrade_accounts',
        {
            v9420: BalancesUpgradeAccountsCall,
        }
    ),
}

export const constants = {
    CreationFee: createConstant(
        'Balances.CreationFee',
        {
            v1020: BalancesCreationFeeConstant,
        }
    ),
    ExistentialDeposit: createConstant(
        'Balances.ExistentialDeposit',
        {
            v1020: BalancesExistentialDepositConstant,
        }
    ),
    MaxFreezes: createConstant(
        'Balances.MaxFreezes',
        {
            v9420: BalancesMaxFreezesConstant,
        }
    ),
    MaxHolds: createConstant(
        'Balances.MaxHolds',
        {
            v9420: BalancesMaxHoldsConstant,
        }
    ),
    MaxLocks: createConstant(
        'Balances.MaxLocks',
        {
            v9090: BalancesMaxLocksConstant,
        }
    ),
    MaxReserves: createConstant(
        'Balances.MaxReserves',
        {
            v9090: BalancesMaxReservesConstant,
        }
    ),
    TransferFee: createConstant(
        'Balances.TransferFee',
        {
            v1020: BalancesTransferFeeConstant,
        }
    ),
}

export const storage = {
    Account: createStorage(
        'Balances.Account',
        {
            v1050: BalancesAccountStorage,
            v9420: BalancesAccountStorage,
        }
    ),
    FreeBalance: createStorage(
        'Balances.FreeBalance',
        {
            v1020: BalancesFreeBalanceStorage,
        }
    ),
    Freezes: createStorage(
        'Balances.Freezes',
        {
            v9420: BalancesFreezesStorage,
        }
    ),
    Holds: createStorage(
        'Balances.Holds',
        {
            v9420: BalancesHoldsStorage,
        }
    ),
    InactiveIssuance: createStorage(
        'Balances.InactiveIssuance',
        {
            v9340: BalancesInactiveIssuanceStorage,
        }
    ),
    Locks: createStorage(
        'Balances.Locks',
        {
            v1020: BalancesLocksStorage,
            v1050: BalancesLocksStorage,
        }
    ),
    ReservedBalance: createStorage(
        'Balances.ReservedBalance',
        {
            v1020: BalancesReservedBalanceStorage,
        }
    ),
    Reserves: createStorage(
        'Balances.Reserves',
        {
            v9050: BalancesReservesStorage,
        }
    ),
    StorageVersion: createStorage(
        'Balances.StorageVersion',
        {
            v1050: BalancesStorageVersionStorage,
            v9111: BalancesStorageVersionStorage,
        }
    ),
    TotalIssuance: createStorage(
        'Balances.TotalIssuance',
        {
            v1020: BalancesTotalIssuanceStorage,
        }
    ),
    Vesting: createStorage(
        'Balances.Vesting',
        {
            v1020: BalancesVestingStorage,
        }
    ),
}

export default {events, calls, constants}
