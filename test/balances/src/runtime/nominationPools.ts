import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9420 from './types/v9420'
import * as v9340 from './types/v9340'
import * as v9291 from './types/v9291'
import * as v9271 from './types/v9271'
import * as v9250 from './types/v9250'
import * as v9230 from './types/v9230'
import * as v9220 from './types/v9220'

export const events = {
    Bonded: createEvent(
        'NominationPools.Bonded',
        {
            v9220: v9220.NominationPoolsBondedEvent,
        }
    ),
    Created: createEvent(
        'NominationPools.Created',
        {
            v9220: v9220.NominationPoolsCreatedEvent,
        }
    ),
    Destroyed: createEvent(
        'NominationPools.Destroyed',
        {
            v9220: v9220.NominationPoolsDestroyedEvent,
        }
    ),
    MemberRemoved: createEvent(
        'NominationPools.MemberRemoved',
        {
            v9220: v9220.NominationPoolsMemberRemovedEvent,
        }
    ),
    PaidOut: createEvent(
        'NominationPools.PaidOut',
        {
            v9220: v9220.NominationPoolsPaidOutEvent,
        }
    ),
    PoolCommissionChangeRateUpdated: createEvent(
        'NominationPools.PoolCommissionChangeRateUpdated',
        {
            v9420: v9420.NominationPoolsPoolCommissionChangeRateUpdatedEvent,
        }
    ),
    PoolCommissionClaimed: createEvent(
        'NominationPools.PoolCommissionClaimed',
        {
            v9420: v9420.NominationPoolsPoolCommissionClaimedEvent,
        }
    ),
    PoolCommissionUpdated: createEvent(
        'NominationPools.PoolCommissionUpdated',
        {
            v9420: v9420.NominationPoolsPoolCommissionUpdatedEvent,
        }
    ),
    PoolMaxCommissionUpdated: createEvent(
        'NominationPools.PoolMaxCommissionUpdated',
        {
            v9420: v9420.NominationPoolsPoolMaxCommissionUpdatedEvent,
        }
    ),
    PoolSlashed: createEvent(
        'NominationPools.PoolSlashed',
        {
            v9250: v9250.NominationPoolsPoolSlashedEvent,
        }
    ),
    RolesUpdated: createEvent(
        'NominationPools.RolesUpdated',
        {
            v9220: v9220.NominationPoolsRolesUpdatedEvent,
            v9230: v9230.NominationPoolsRolesUpdatedEvent,
            v9420: v9420.NominationPoolsRolesUpdatedEvent,
        }
    ),
    StateChanged: createEvent(
        'NominationPools.StateChanged',
        {
            v9220: v9220.NominationPoolsStateChangedEvent,
        }
    ),
    Unbonded: createEvent(
        'NominationPools.Unbonded',
        {
            v9220: v9220.NominationPoolsUnbondedEvent,
            v9250: v9250.NominationPoolsUnbondedEvent,
            v9271: v9271.NominationPoolsUnbondedEvent,
        }
    ),
    UnbondingPoolSlashed: createEvent(
        'NominationPools.UnbondingPoolSlashed',
        {
            v9250: v9250.NominationPoolsUnbondingPoolSlashedEvent,
        }
    ),
    Withdrawn: createEvent(
        'NominationPools.Withdrawn',
        {
            v9220: v9220.NominationPoolsWithdrawnEvent,
            v9250: v9250.NominationPoolsWithdrawnEvent,
        }
    ),
}

export const calls = {
    bond_extra: createCall(
        'NominationPools.bond_extra',
        {
            v9220: v9220.NominationPoolsBondExtraCall,
        }
    ),
    bond_extra_other: createCall(
        'NominationPools.bond_extra_other',
        {
            v9420: v9420.NominationPoolsBondExtraOtherCall,
        }
    ),
    chill: createCall(
        'NominationPools.chill',
        {
            v9250: v9250.NominationPoolsChillCall,
        }
    ),
    claim_commission: createCall(
        'NominationPools.claim_commission',
        {
            v9420: v9420.NominationPoolsClaimCommissionCall,
        }
    ),
    claim_payout: createCall(
        'NominationPools.claim_payout',
        {
            v9220: v9220.NominationPoolsClaimPayoutCall,
        }
    ),
    claim_payout_other: createCall(
        'NominationPools.claim_payout_other',
        {
            v9420: v9420.NominationPoolsClaimPayoutOtherCall,
        }
    ),
    create: createCall(
        'NominationPools.create',
        {
            v9220: v9220.NominationPoolsCreateCall,
            v9291: v9291.NominationPoolsCreateCall,
            v9420: v9420.NominationPoolsCreateCall,
        }
    ),
    create_with_pool_id: createCall(
        'NominationPools.create_with_pool_id',
        {
            v9340: v9340.NominationPoolsCreateWithPoolIdCall,
            v9420: v9420.NominationPoolsCreateWithPoolIdCall,
        }
    ),
    join: createCall(
        'NominationPools.join',
        {
            v9220: v9220.NominationPoolsJoinCall,
        }
    ),
    nominate: createCall(
        'NominationPools.nominate',
        {
            v9220: v9220.NominationPoolsNominateCall,
        }
    ),
    pool_withdraw_unbonded: createCall(
        'NominationPools.pool_withdraw_unbonded',
        {
            v9220: v9220.NominationPoolsPoolWithdrawUnbondedCall,
        }
    ),
    set_claim_permission: createCall(
        'NominationPools.set_claim_permission',
        {
            v9420: v9420.NominationPoolsSetClaimPermissionCall,
        }
    ),
    set_commission: createCall(
        'NominationPools.set_commission',
        {
            v9420: v9420.NominationPoolsSetCommissionCall,
        }
    ),
    set_commission_change_rate: createCall(
        'NominationPools.set_commission_change_rate',
        {
            v9420: v9420.NominationPoolsSetCommissionChangeRateCall,
        }
    ),
    set_commission_max: createCall(
        'NominationPools.set_commission_max',
        {
            v9420: v9420.NominationPoolsSetCommissionMaxCall,
        }
    ),
    set_configs: createCall(
        'NominationPools.set_configs',
        {
            v9220: v9220.NominationPoolsSetConfigsCall,
            v9420: v9420.NominationPoolsSetConfigsCall,
        }
    ),
    set_metadata: createCall(
        'NominationPools.set_metadata',
        {
            v9220: v9220.NominationPoolsSetMetadataCall,
        }
    ),
    set_state: createCall(
        'NominationPools.set_state',
        {
            v9220: v9220.NominationPoolsSetStateCall,
        }
    ),
    unbond: createCall(
        'NominationPools.unbond',
        {
            v9220: v9220.NominationPoolsUnbondCall,
            v9291: v9291.NominationPoolsUnbondCall,
        }
    ),
    update_roles: createCall(
        'NominationPools.update_roles',
        {
            v9220: v9220.NominationPoolsUpdateRolesCall,
            v9230: v9230.NominationPoolsUpdateRolesCall,
            v9420: v9420.NominationPoolsUpdateRolesCall,
        }
    ),
    withdraw_unbonded: createCall(
        'NominationPools.withdraw_unbonded',
        {
            v9220: v9220.NominationPoolsWithdrawUnbondedCall,
            v9291: v9291.NominationPoolsWithdrawUnbondedCall,
        }
    ),
}

export const constants = {
    MaxPointsToBalance: createConstant(
        'NominationPools.MaxPointsToBalance',
        {
            v9271: v9271.NominationPoolsMaxPointsToBalanceConstant,
        }
    ),
    MinPointsToBalance: createConstant(
        'NominationPools.MinPointsToBalance',
        {
            v9230: v9230.NominationPoolsMinPointsToBalanceConstant,
        }
    ),
    PalletId: createConstant(
        'NominationPools.PalletId',
        {
            v9220: v9220.NominationPoolsPalletIdConstant,
        }
    ),
}

export const storage = {
    BondedPools: createStorage(
        'NominationPools.BondedPools',
        {
            v9220: v9220.NominationPoolsBondedPoolsStorage,
            v9230: v9230.NominationPoolsBondedPoolsStorage,
            v9420: v9420.NominationPoolsBondedPoolsStorage,
        }
    ),
    ClaimPermissions: createStorage(
        'NominationPools.ClaimPermissions',
        {
            v9420: v9420.NominationPoolsClaimPermissionsStorage,
        }
    ),
    CounterForBondedPools: createStorage(
        'NominationPools.CounterForBondedPools',
        {
            v9220: v9220.NominationPoolsCounterForBondedPoolsStorage,
        }
    ),
    CounterForMetadata: createStorage(
        'NominationPools.CounterForMetadata',
        {
            v9220: v9220.NominationPoolsCounterForMetadataStorage,
        }
    ),
    CounterForPoolMembers: createStorage(
        'NominationPools.CounterForPoolMembers',
        {
            v9220: v9220.NominationPoolsCounterForPoolMembersStorage,
        }
    ),
    CounterForReversePoolIdLookup: createStorage(
        'NominationPools.CounterForReversePoolIdLookup',
        {
            v9220: v9220.NominationPoolsCounterForReversePoolIdLookupStorage,
        }
    ),
    CounterForRewardPools: createStorage(
        'NominationPools.CounterForRewardPools',
        {
            v9220: v9220.NominationPoolsCounterForRewardPoolsStorage,
        }
    ),
    CounterForSubPoolsStorage: createStorage(
        'NominationPools.CounterForSubPoolsStorage',
        {
            v9220: v9220.NominationPoolsCounterForSubPoolsStorageStorage,
        }
    ),
    GlobalMaxCommission: createStorage(
        'NominationPools.GlobalMaxCommission',
        {
            v9420: v9420.NominationPoolsGlobalMaxCommissionStorage,
        }
    ),
    LastPoolId: createStorage(
        'NominationPools.LastPoolId',
        {
            v9220: v9220.NominationPoolsLastPoolIdStorage,
        }
    ),
    MaxPoolMembers: createStorage(
        'NominationPools.MaxPoolMembers',
        {
            v9220: v9220.NominationPoolsMaxPoolMembersStorage,
        }
    ),
    MaxPoolMembersPerPool: createStorage(
        'NominationPools.MaxPoolMembersPerPool',
        {
            v9220: v9220.NominationPoolsMaxPoolMembersPerPoolStorage,
        }
    ),
    MaxPools: createStorage(
        'NominationPools.MaxPools',
        {
            v9220: v9220.NominationPoolsMaxPoolsStorage,
        }
    ),
    Metadata: createStorage(
        'NominationPools.Metadata',
        {
            v9220: v9220.NominationPoolsMetadataStorage,
        }
    ),
    MinCreateBond: createStorage(
        'NominationPools.MinCreateBond',
        {
            v9220: v9220.NominationPoolsMinCreateBondStorage,
        }
    ),
    MinJoinBond: createStorage(
        'NominationPools.MinJoinBond',
        {
            v9220: v9220.NominationPoolsMinJoinBondStorage,
        }
    ),
    PoolMembers: createStorage(
        'NominationPools.PoolMembers',
        {
            v9220: v9220.NominationPoolsPoolMembersStorage,
            v9271: v9271.NominationPoolsPoolMembersStorage,
        }
    ),
    ReversePoolIdLookup: createStorage(
        'NominationPools.ReversePoolIdLookup',
        {
            v9220: v9220.NominationPoolsReversePoolIdLookupStorage,
        }
    ),
    RewardPools: createStorage(
        'NominationPools.RewardPools',
        {
            v9220: v9220.NominationPoolsRewardPoolsStorage,
            v9271: v9271.NominationPoolsRewardPoolsStorage,
            v9420: v9420.NominationPoolsRewardPoolsStorage,
        }
    ),
    SubPoolsStorage: createStorage(
        'NominationPools.SubPoolsStorage',
        {
            v9220: v9220.NominationPoolsSubPoolsStorageStorage,
        }
    ),
}

export default {events, calls, constants}
