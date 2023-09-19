import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    BalanceSet: createEvent(
        'NisCounterpartBalances.BalanceSet',
        {
            v9340: NisCounterpartBalancesBalanceSetEvent,
            v9420: NisCounterpartBalancesBalanceSetEvent,
        }
    ),
    Burned: createEvent(
        'NisCounterpartBalances.Burned',
        {
            v9420: NisCounterpartBalancesBurnedEvent,
        }
    ),
    Deposit: createEvent(
        'NisCounterpartBalances.Deposit',
        {
            v9340: NisCounterpartBalancesDepositEvent,
        }
    ),
    DustLost: createEvent(
        'NisCounterpartBalances.DustLost',
        {
            v9340: NisCounterpartBalancesDustLostEvent,
        }
    ),
    Endowed: createEvent(
        'NisCounterpartBalances.Endowed',
        {
            v9340: NisCounterpartBalancesEndowedEvent,
        }
    ),
    Frozen: createEvent(
        'NisCounterpartBalances.Frozen',
        {
            v9420: NisCounterpartBalancesFrozenEvent,
        }
    ),
    Issued: createEvent(
        'NisCounterpartBalances.Issued',
        {
            v9420: NisCounterpartBalancesIssuedEvent,
        }
    ),
    Locked: createEvent(
        'NisCounterpartBalances.Locked',
        {
            v9420: NisCounterpartBalancesLockedEvent,
        }
    ),
    Minted: createEvent(
        'NisCounterpartBalances.Minted',
        {
            v9420: NisCounterpartBalancesMintedEvent,
        }
    ),
    Rescinded: createEvent(
        'NisCounterpartBalances.Rescinded',
        {
            v9420: NisCounterpartBalancesRescindedEvent,
        }
    ),
    ReserveRepatriated: createEvent(
        'NisCounterpartBalances.ReserveRepatriated',
        {
            v9340: NisCounterpartBalancesReserveRepatriatedEvent,
        }
    ),
    Reserved: createEvent(
        'NisCounterpartBalances.Reserved',
        {
            v9340: NisCounterpartBalancesReservedEvent,
        }
    ),
    Restored: createEvent(
        'NisCounterpartBalances.Restored',
        {
            v9420: NisCounterpartBalancesRestoredEvent,
        }
    ),
    Slashed: createEvent(
        'NisCounterpartBalances.Slashed',
        {
            v9340: NisCounterpartBalancesSlashedEvent,
        }
    ),
    Suspended: createEvent(
        'NisCounterpartBalances.Suspended',
        {
            v9420: NisCounterpartBalancesSuspendedEvent,
        }
    ),
    Thawed: createEvent(
        'NisCounterpartBalances.Thawed',
        {
            v9420: NisCounterpartBalancesThawedEvent,
        }
    ),
    Transfer: createEvent(
        'NisCounterpartBalances.Transfer',
        {
            v9340: NisCounterpartBalancesTransferEvent,
        }
    ),
    Unlocked: createEvent(
        'NisCounterpartBalances.Unlocked',
        {
            v9420: NisCounterpartBalancesUnlockedEvent,
        }
    ),
    Unreserved: createEvent(
        'NisCounterpartBalances.Unreserved',
        {
            v9340: NisCounterpartBalancesUnreservedEvent,
        }
    ),
    Upgraded: createEvent(
        'NisCounterpartBalances.Upgraded',
        {
            v9420: NisCounterpartBalancesUpgradedEvent,
        }
    ),
    Withdraw: createEvent(
        'NisCounterpartBalances.Withdraw',
        {
            v9340: NisCounterpartBalancesWithdrawEvent,
        }
    ),
}

export const calls = {
    force_set_balance: createCall(
        'NisCounterpartBalances.force_set_balance',
        {
            v9420: NisCounterpartBalancesForceSetBalanceCall,
        }
    ),
    force_transfer: createCall(
        'NisCounterpartBalances.force_transfer',
        {
            v9340: NisCounterpartBalancesForceTransferCall,
        }
    ),
    force_unreserve: createCall(
        'NisCounterpartBalances.force_unreserve',
        {
            v9340: NisCounterpartBalancesForceUnreserveCall,
        }
    ),
    set_balance: createCall(
        'NisCounterpartBalances.set_balance',
        {
            v9340: NisCounterpartBalancesSetBalanceCall,
        }
    ),
    set_balance_deprecated: createCall(
        'NisCounterpartBalances.set_balance_deprecated',
        {
            v9420: NisCounterpartBalancesSetBalanceDeprecatedCall,
        }
    ),
    transfer: createCall(
        'NisCounterpartBalances.transfer',
        {
            v9340: NisCounterpartBalancesTransferCall,
        }
    ),
    transfer_all: createCall(
        'NisCounterpartBalances.transfer_all',
        {
            v9340: NisCounterpartBalancesTransferAllCall,
        }
    ),
    transfer_allow_death: createCall(
        'NisCounterpartBalances.transfer_allow_death',
        {
            v9420: NisCounterpartBalancesTransferAllowDeathCall,
        }
    ),
    transfer_keep_alive: createCall(
        'NisCounterpartBalances.transfer_keep_alive',
        {
            v9340: NisCounterpartBalancesTransferKeepAliveCall,
        }
    ),
    upgrade_accounts: createCall(
        'NisCounterpartBalances.upgrade_accounts',
        {
            v9420: NisCounterpartBalancesUpgradeAccountsCall,
        }
    ),
}

export const constants = {
    ExistentialDeposit: createConstant(
        'NisCounterpartBalances.ExistentialDeposit',
        {
            v9340: NisCounterpartBalancesExistentialDepositConstant,
        }
    ),
    MaxFreezes: createConstant(
        'NisCounterpartBalances.MaxFreezes',
        {
            v9420: NisCounterpartBalancesMaxFreezesConstant,
        }
    ),
    MaxHolds: createConstant(
        'NisCounterpartBalances.MaxHolds',
        {
            v9420: NisCounterpartBalancesMaxHoldsConstant,
        }
    ),
    MaxLocks: createConstant(
        'NisCounterpartBalances.MaxLocks',
        {
            v9340: NisCounterpartBalancesMaxLocksConstant,
        }
    ),
    MaxReserves: createConstant(
        'NisCounterpartBalances.MaxReserves',
        {
            v9340: NisCounterpartBalancesMaxReservesConstant,
        }
    ),
}

export const storage = {
    Account: createStorage(
        'NisCounterpartBalances.Account',
        {
            v9340: NisCounterpartBalancesAccountStorage,
            v9420: NisCounterpartBalancesAccountStorage,
        }
    ),
    Freezes: createStorage(
        'NisCounterpartBalances.Freezes',
        {
            v9420: NisCounterpartBalancesFreezesStorage,
        }
    ),
    Holds: createStorage(
        'NisCounterpartBalances.Holds',
        {
            v9420: NisCounterpartBalancesHoldsStorage,
        }
    ),
    InactiveIssuance: createStorage(
        'NisCounterpartBalances.InactiveIssuance',
        {
            v9340: NisCounterpartBalancesInactiveIssuanceStorage,
        }
    ),
    Locks: createStorage(
        'NisCounterpartBalances.Locks',
        {
            v9340: NisCounterpartBalancesLocksStorage,
        }
    ),
    Reserves: createStorage(
        'NisCounterpartBalances.Reserves',
        {
            v9340: NisCounterpartBalancesReservesStorage,
        }
    ),
    TotalIssuance: createStorage(
        'NisCounterpartBalances.TotalIssuance',
        {
            v9340: NisCounterpartBalancesTotalIssuanceStorage,
        }
    ),
}

export default {events, calls, constants}
