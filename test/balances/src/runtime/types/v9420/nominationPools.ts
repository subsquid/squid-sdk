import {sts} from '../../pallet.support'
import {Type_312, Type_309, Type_310, Type_311, Perbill, CommissionChangeRate, AccountId32, ClaimPermission, MultiAddress, BondExtra} from './types'

/**
 * Update the roles of the pool.
 * 
 * The root is the only entity that can change any of the roles, including itself,
 * excluding the depositor, who can never change.
 * 
 * It emits an event, notifying UIs of the role change. This event is quite relevant to
 * most pool members and they should be informed of changes to pool roles.
 */
export type NominationPoolsUpdateRolesCall = {
    poolId: number,
    newRoot: Type_312,
    newNominator: Type_312,
    newBouncer: Type_312,
}

export const NominationPoolsUpdateRolesCall: sts.Type<NominationPoolsUpdateRolesCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        newRoot: Type_312,
        newNominator: Type_312,
        newBouncer: Type_312,
    }
})

/**
 * Update configurations for the nomination pools. The origin for this call must be
 * Root.
 * 
 * # Arguments
 * 
 * * `min_join_bond` - Set [`MinJoinBond`].
 * * `min_create_bond` - Set [`MinCreateBond`].
 * * `max_pools` - Set [`MaxPools`].
 * * `max_members` - Set [`MaxPoolMembers`].
 * * `max_members_per_pool` - Set [`MaxPoolMembersPerPool`].
 * * `global_max_commission` - Set [`GlobalMaxCommission`].
 */
export type NominationPoolsSetConfigsCall = {
    minJoinBond: Type_309,
    minCreateBond: Type_309,
    maxPools: Type_310,
    maxMembers: Type_310,
    maxMembersPerPool: Type_310,
    globalMaxCommission: Type_311,
}

export const NominationPoolsSetConfigsCall: sts.Type<NominationPoolsSetConfigsCall> = sts.struct(() => {
    return  {
        minJoinBond: Type_309,
        minCreateBond: Type_309,
        maxPools: Type_310,
        maxMembers: Type_310,
        maxMembersPerPool: Type_310,
        globalMaxCommission: Type_311,
    }
})

/**
 * Set the maximum commission of a pool.
 * 
 * - Initial max can be set to any `Perbill`, and only smaller values thereafter.
 * - Current commission will be lowered in the event it is higher than a new max
 *   commission.
 */
export type NominationPoolsSetCommissionMaxCall = {
    poolId: number,
    maxCommission: Perbill,
}

export const NominationPoolsSetCommissionMaxCall: sts.Type<NominationPoolsSetCommissionMaxCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        maxCommission: Perbill,
    }
})

/**
 * Set the commission change rate for a pool.
 * 
 * Initial change rate is not bounded, whereas subsequent updates can only be more
 * restrictive than the current.
 */
export type NominationPoolsSetCommissionChangeRateCall = {
    poolId: number,
    changeRate: CommissionChangeRate,
}

export const NominationPoolsSetCommissionChangeRateCall: sts.Type<NominationPoolsSetCommissionChangeRateCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        changeRate: CommissionChangeRate,
    }
})

/**
 * Set the commission of a pool.
 * Both a commission percentage and a commission payee must be provided in the `current`
 * tuple. Where a `current` of `None` is provided, any current commission will be removed.
 * 
 * - If a `None` is supplied to `new_commission`, existing commission will be removed.
 */
export type NominationPoolsSetCommissionCall = {
    poolId: number,
    newCommission?: ([Perbill, AccountId32] | undefined),
}

export const NominationPoolsSetCommissionCall: sts.Type<NominationPoolsSetCommissionCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        newCommission: sts.option(() => sts.tuple(() => Perbill, AccountId32)),
    }
})

/**
 * Allows a pool member to set a claim permission to allow or disallow permissionless
 * bonding and withdrawing.
 * 
 * By default, this is `Permissioned`, which implies only the pool member themselves can
 * claim their pending rewards. If a pool member wishes so, they can set this to
 * `PermissionlessAll` to allow any account to claim their rewards and bond extra to the
 * pool.
 * 
 * # Arguments
 * 
 * * `origin` - Member of a pool.
 * * `actor` - Account to claim reward. // improve this
 */
export type NominationPoolsSetClaimPermissionCall = {
    permission: ClaimPermission,
}

export const NominationPoolsSetClaimPermissionCall: sts.Type<NominationPoolsSetClaimPermissionCall> = sts.struct(() => {
    return  {
        permission: ClaimPermission,
    }
})

/**
 * Create a new delegation pool with a previously used pool id
 * 
 * # Arguments
 * 
 * same as `create` with the inclusion of
 * * `pool_id` - `A valid PoolId.
 */
export type NominationPoolsCreateWithPoolIdCall = {
    amount: bigint,
    root: MultiAddress,
    nominator: MultiAddress,
    bouncer: MultiAddress,
    poolId: number,
}

export const NominationPoolsCreateWithPoolIdCall: sts.Type<NominationPoolsCreateWithPoolIdCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        root: MultiAddress,
        nominator: MultiAddress,
        bouncer: MultiAddress,
        poolId: sts.number(),
    }
})

/**
 * Create a new delegation pool.
 * 
 * # Arguments
 * 
 * * `amount` - The amount of funds to delegate to the pool. This also acts of a sort of
 *   deposit since the pools creator cannot fully unbond funds until the pool is being
 *   destroyed.
 * * `index` - A disambiguation index for creating the account. Likely only useful when
 *   creating multiple pools in the same extrinsic.
 * * `root` - The account to set as [`PoolRoles::root`].
 * * `nominator` - The account to set as the [`PoolRoles::nominator`].
 * * `bouncer` - The account to set as the [`PoolRoles::bouncer`].
 * 
 * # Note
 * 
 * In addition to `amount`, the caller will transfer the existential deposit; so the caller
 * needs at have at least `amount + existential_deposit` transferrable.
 */
export type NominationPoolsCreateCall = {
    amount: bigint,
    root: MultiAddress,
    nominator: MultiAddress,
    bouncer: MultiAddress,
}

export const NominationPoolsCreateCall: sts.Type<NominationPoolsCreateCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        root: MultiAddress,
        nominator: MultiAddress,
        bouncer: MultiAddress,
    }
})

/**
 * `origin` can claim payouts on some pool member `other`'s behalf.
 * 
 * Pool member `other` must have a `PermissionlessAll` or `PermissionlessWithdraw` in order
 * for this call to be successful.
 */
export type NominationPoolsClaimPayoutOtherCall = {
    other: AccountId32,
}

export const NominationPoolsClaimPayoutOtherCall: sts.Type<NominationPoolsClaimPayoutOtherCall> = sts.struct(() => {
    return  {
        other: AccountId32,
    }
})

/**
 * Claim pending commission.
 * 
 * The dispatch origin of this call must be signed by the `root` role of the pool. Pending
 * commission is paid out and added to total claimed commission`. Total pending commission
 * is reset to zero. the current.
 */
export type NominationPoolsClaimCommissionCall = {
    poolId: number,
}

export const NominationPoolsClaimCommissionCall: sts.Type<NominationPoolsClaimCommissionCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
    }
})

/**
 * `origin` bonds funds from `extra` for some pool member `member` into their respective
 * pools.
 * 
 * `origin` can bond extra funds from free balance or pending rewards when `origin ==
 * other`.
 * 
 * In the case of `origin != other`, `origin` can only bond extra pending rewards of
 * `other` members assuming set_claim_permission for the given member is
 * `PermissionlessAll` or `PermissionlessCompound`.
 */
export type NominationPoolsBondExtraOtherCall = {
    member: MultiAddress,
    extra: BondExtra,
}

export const NominationPoolsBondExtraOtherCall: sts.Type<NominationPoolsBondExtraOtherCall> = sts.struct(() => {
    return  {
        member: MultiAddress,
        extra: BondExtra,
    }
})

/**
 * The roles of a pool have been updated to the given new roles. Note that the depositor
 * can never change.
 */
export type NominationPoolsRolesUpdatedEvent = {
    root?: (AccountId32 | undefined),
    bouncer?: (AccountId32 | undefined),
    nominator?: (AccountId32 | undefined),
}

export const NominationPoolsRolesUpdatedEvent: sts.Type<NominationPoolsRolesUpdatedEvent> = sts.struct(() => {
    return  {
        root: sts.option(() => AccountId32),
        bouncer: sts.option(() => AccountId32),
        nominator: sts.option(() => AccountId32),
    }
})

/**
 * A pool's maximum commission setting has been changed.
 */
export type NominationPoolsPoolMaxCommissionUpdatedEvent = {
    poolId: number,
    maxCommission: Perbill,
}

export const NominationPoolsPoolMaxCommissionUpdatedEvent: sts.Type<NominationPoolsPoolMaxCommissionUpdatedEvent> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        maxCommission: Perbill,
    }
})

/**
 * A pool's commission setting has been changed.
 */
export type NominationPoolsPoolCommissionUpdatedEvent = {
    poolId: number,
    current?: ([Perbill, AccountId32] | undefined),
}

export const NominationPoolsPoolCommissionUpdatedEvent: sts.Type<NominationPoolsPoolCommissionUpdatedEvent> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        current: sts.option(() => sts.tuple(() => Perbill, AccountId32)),
    }
})

/**
 * Pool commission has been claimed.
 */
export type NominationPoolsPoolCommissionClaimedEvent = {
    poolId: number,
    commission: bigint,
}

export const NominationPoolsPoolCommissionClaimedEvent: sts.Type<NominationPoolsPoolCommissionClaimedEvent> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        commission: sts.bigint(),
    }
})

/**
 * A pool's commission `change_rate` has been changed.
 */
export type NominationPoolsPoolCommissionChangeRateUpdatedEvent = {
    poolId: number,
    changeRate: CommissionChangeRate,
}

export const NominationPoolsPoolCommissionChangeRateUpdatedEvent: sts.Type<NominationPoolsPoolCommissionChangeRateUpdatedEvent> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        changeRate: CommissionChangeRate,
    }
})
