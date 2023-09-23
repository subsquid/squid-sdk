import {VersionedEvent, VersionedCall, VersionedConstant, VersionedStorage, sts} from './pallet.support'
import * as v9420 from './types/v9420'
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
    BalanceSet: VersionedEvent(
        'Balances.BalanceSet',
        {
            v1031: v1031.BalancesBalanceSetEvent,
            v9130: v9130.BalancesBalanceSetEvent,
            v9420: v9420.BalancesBalanceSetEvent,
        }
    ),
    Burned: VersionedEvent(
        'Balances.Burned',
        {
            v9420: v9420.BalancesBurnedEvent,
        }
    ),
    Deposit: VersionedEvent(
        'Balances.Deposit',
        {
            v1032: v1032.BalancesDepositEvent,
            v9130: v9130.BalancesDepositEvent,
        }
    ),
    DustLost: VersionedEvent(
        'Balances.DustLost',
        {
            v1050: v1050.BalancesDustLostEvent,
            v9130: v9130.BalancesDustLostEvent,
        }
    ),
    Endowed: VersionedEvent(
        'Balances.Endowed',
        {
            v1050: v1050.BalancesEndowedEvent,
            v9130: v9130.BalancesEndowedEvent,
        }
    ),
    Frozen: VersionedEvent(
        'Balances.Frozen',
        {
            v9420: v9420.BalancesFrozenEvent,
        }
    ),
    Issued: VersionedEvent(
        'Balances.Issued',
        {
            v9420: v9420.BalancesIssuedEvent,
        }
    ),
    Locked: VersionedEvent(
        'Balances.Locked',
        {
            v9420: v9420.BalancesLockedEvent,
        }
    ),
    Minted: VersionedEvent(
        'Balances.Minted',
        {
            v9420: v9420.BalancesMintedEvent,
        }
    ),
    NewAccount: VersionedEvent(
        'Balances.NewAccount',
        {
            v1020: v1020.BalancesNewAccountEvent,
        }
    ),
    ReapedAccount: VersionedEvent(
        'Balances.ReapedAccount',
        {
            v1020: v1020.BalancesReapedAccountEvent,
            v1031: v1031.BalancesReapedAccountEvent,
        }
    ),
    Rescinded: VersionedEvent(
        'Balances.Rescinded',
        {
            v9420: v9420.BalancesRescindedEvent,
        }
    ),
    ReserveRepatriated: VersionedEvent(
        'Balances.ReserveRepatriated',
        {
            v2008: v2008.BalancesReserveRepatriatedEvent,
            v9130: v9130.BalancesReserveRepatriatedEvent,
        }
    ),
    Reserved: VersionedEvent(
        'Balances.Reserved',
        {
            v2008: v2008.BalancesReservedEvent,
            v9130: v9130.BalancesReservedEvent,
        }
    ),
    Restored: VersionedEvent(
        'Balances.Restored',
        {
            v9420: v9420.BalancesRestoredEvent,
        }
    ),
    Slashed: VersionedEvent(
        'Balances.Slashed',
        {
            v9122: v9122.BalancesSlashedEvent,
            v9130: v9130.BalancesSlashedEvent,
        }
    ),
    Suspended: VersionedEvent(
        'Balances.Suspended',
        {
            v9420: v9420.BalancesSuspendedEvent,
        }
    ),
    Thawed: VersionedEvent(
        'Balances.Thawed',
        {
            v9420: v9420.BalancesThawedEvent,
        }
    ),
    Transfer: VersionedEvent(
        'Balances.Transfer',
        {
            v1020: v1020.BalancesTransferEvent,
            v1050: v1050.BalancesTransferEvent,
            v9130: v9130.BalancesTransferEvent,
        }
    ),
    Unlocked: VersionedEvent(
        'Balances.Unlocked',
        {
            v9420: v9420.BalancesUnlockedEvent,
        }
    ),
    Unreserved: VersionedEvent(
        'Balances.Unreserved',
        {
            v2008: v2008.BalancesUnreservedEvent,
            v9130: v9130.BalancesUnreservedEvent,
        }
    ),
    Upgraded: VersionedEvent(
        'Balances.Upgraded',
        {
            v9420: v9420.BalancesUpgradedEvent,
        }
    ),
    Withdraw: VersionedEvent(
        'Balances.Withdraw',
        {
            v9122: v9122.BalancesWithdrawEvent,
            v9130: v9130.BalancesWithdrawEvent,
        }
    ),
}

export const calls = {
    force_set_balance: VersionedCall(
        'Balances.force_set_balance',
        {
            v9420: v9420.BalancesForceSetBalanceCall,
        }
    ),
    force_transfer: VersionedCall(
        'Balances.force_transfer',
        {
            v1020: v1020.BalancesForceTransferCall,
            v1050: v1050.BalancesForceTransferCall,
            v2028: v2028.BalancesForceTransferCall,
            v9111: v9111.BalancesForceTransferCall,
        }
    ),
    force_unreserve: VersionedCall(
        'Balances.force_unreserve',
        {
            v9111: v9111.BalancesForceUnreserveCall,
        }
    ),
    set_balance: VersionedCall(
        'Balances.set_balance',
        {
            v1020: v1020.BalancesSetBalanceCall,
            v1050: v1050.BalancesSetBalanceCall,
            v2028: v2028.BalancesSetBalanceCall,
            v9111: v9111.BalancesSetBalanceCall,
        }
    ),
    set_balance_deprecated: VersionedCall(
        'Balances.set_balance_deprecated',
        {
            v9420: v9420.BalancesSetBalanceDeprecatedCall,
        }
    ),
    transfer: VersionedCall(
        'Balances.transfer',
        {
            v1020: v1020.BalancesTransferCall,
            v1050: v1050.BalancesTransferCall,
            v2028: v2028.BalancesTransferCall,
            v9111: v9111.BalancesTransferCall,
        }
    ),
    transfer_all: VersionedCall(
        'Balances.transfer_all',
        {
            v9050: v9050.BalancesTransferAllCall,
            v9111: v9111.BalancesTransferAllCall,
        }
    ),
    transfer_allow_death: VersionedCall(
        'Balances.transfer_allow_death',
        {
            v9420: v9420.BalancesTransferAllowDeathCall,
        }
    ),
    transfer_keep_alive: VersionedCall(
        'Balances.transfer_keep_alive',
        {
            v1020: v1020.BalancesTransferKeepAliveCall,
            v1050: v1050.BalancesTransferKeepAliveCall,
            v2028: v2028.BalancesTransferKeepAliveCall,
            v9111: v9111.BalancesTransferKeepAliveCall,
        }
    ),
    upgrade_accounts: VersionedCall(
        'Balances.upgrade_accounts',
        {
            v9420: v9420.BalancesUpgradeAccountsCall,
        }
    ),
}

export const constants = {
    CreationFee: VersionedConstant(
        'Balances.CreationFee',
        {
            v1020: v1020.BalancesCreationFeeConstant,
        }
    ),
    ExistentialDeposit: VersionedConstant(
        'Balances.ExistentialDeposit',
        {
            v1020: v1020.BalancesExistentialDepositConstant,
        }
    ),
    MaxFreezes: VersionedConstant(
        'Balances.MaxFreezes',
        {
            v9420: v9420.BalancesMaxFreezesConstant,
        }
    ),
    MaxHolds: VersionedConstant(
        'Balances.MaxHolds',
        {
            v9420: v9420.BalancesMaxHoldsConstant,
        }
    ),
    MaxLocks: VersionedConstant(
        'Balances.MaxLocks',
        {
            v9090: v9090.BalancesMaxLocksConstant,
        }
    ),
    MaxReserves: VersionedConstant(
        'Balances.MaxReserves',
        {
            v9090: v9090.BalancesMaxReservesConstant,
        }
    ),
    TransferFee: VersionedConstant(
        'Balances.TransferFee',
        {
            v1020: v1020.BalancesTransferFeeConstant,
        }
    ),
}

export default {events, calls, constants}
