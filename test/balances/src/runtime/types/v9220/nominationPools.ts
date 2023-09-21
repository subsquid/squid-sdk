import {sts} from '../../pallet.support'
import {AccountId32, PoolState, Type_487, Type_488, BondExtra} from './types'

/**
 * Withdraw unbonded funds from `member_account`. If no bonded funds can be unbonded, an
 * error is returned.
 * 
 * Under certain conditions, this call can be dispatched permissionlessly (i.e. by any
 * account).
 * 
 * # Conditions for a permissionless dispatch
 * 
 * * The pool is in destroy mode and the target is not the depositor.
 * * The target is the depositor and they are the only member in the sub pools.
 * * The pool is blocked and the caller is either the root or state-toggler.
 * 
 * # Conditions for permissioned dispatch
 * 
 * * The caller is the target and they are not the depositor.
 * 
 * # Note
 * 
 * If the target is the depositor, the pool will be destroyed.
 */
export type NominationPoolsWithdrawUnbondedCall = {
    memberAccount: AccountId32,
    numSlashingSpans: number,
}

export const NominationPoolsWithdrawUnbondedCall: sts.Type<NominationPoolsWithdrawUnbondedCall> = sts.struct(() => {
    return  {
        memberAccount: AccountId32,
        numSlashingSpans: sts.number(),
    }
})

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
    root?: (AccountId32 | undefined),
    nominator?: (AccountId32 | undefined),
    stateToggler?: (AccountId32 | undefined),
}

export const NominationPoolsUpdateRolesCall: sts.Type<NominationPoolsUpdateRolesCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        root: sts.option(() => AccountId32),
        nominator: sts.option(() => AccountId32),
        stateToggler: sts.option(() => AccountId32),
    }
})

/**
 * Unbond up to `unbonding_points` of the `member_account`'s funds from the pool. It
 * implicitly collects the rewards one last time, since not doing so would mean some
 * rewards would go forfeited.
 * 
 * Under certain conditions, this call can be dispatched permissionlessly (i.e. by any
 * account).
 * 
 * # Conditions for a permissionless dispatch.
 * 
 * * The pool is blocked and the caller is either the root or state-toggler. This is
 *   refereed to as a kick.
 * * The pool is destroying and the member is not the depositor.
 * * The pool is destroying, the member is the depositor and no other members are in the
 *   pool.
 * 
 * ## Conditions for permissioned dispatch (i.e. the caller is also the
 * `member_account`):
 * 
 * * The caller is not the depositor.
 * * The caller is the depositor, the pool is destroying and no other members are in the
 *   pool.
 * 
 * # Note
 * 
 * If there are too many unlocking chunks to unbond with the pool account,
 * [`Call::pool_withdraw_unbonded`] can be called to try and minimize unlocking chunks. If
 * there are too many unlocking chunks, the result of this call will likely be the
 * `NoMoreChunks` error from the staking system.
 */
export type NominationPoolsUnbondCall = {
    memberAccount: AccountId32,
    unbondingPoints: bigint,
}

export const NominationPoolsUnbondCall: sts.Type<NominationPoolsUnbondCall> = sts.struct(() => {
    return  {
        memberAccount: AccountId32,
        unbondingPoints: sts.bigint(),
    }
})

export type NominationPoolsSetStateCall = {
    poolId: number,
    state: PoolState,
}

export const NominationPoolsSetStateCall: sts.Type<NominationPoolsSetStateCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        state: PoolState,
    }
})

export type NominationPoolsSetMetadataCall = {
    poolId: number,
    metadata: Bytes,
}

export const NominationPoolsSetMetadataCall: sts.Type<NominationPoolsSetMetadataCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        metadata: sts.bytes(),
    }
})

/**
 * Update configurations for the nomination pools. The origin must for this call must be
 * Root.
 * 
 * # Arguments
 * 
 * * `min_join_bond` - Set [`MinJoinBond`].
 * * `min_create_bond` - Set [`MinCreateBond`].
 * * `max_pools` - Set [`MaxPools`].
 * * `max_members` - Set [`MaxPoolMembers`].
 * * `max_members_per_pool` - Set [`MaxPoolMembersPerPool`].
 */
export type NominationPoolsSetConfigsCall = {
    minJoinBond: Type_487,
    minCreateBond: Type_487,
    maxPools: Type_488,
    maxMembers: Type_488,
    maxMembersPerPool: Type_488,
}

export const NominationPoolsSetConfigsCall: sts.Type<NominationPoolsSetConfigsCall> = sts.struct(() => {
    return  {
        minJoinBond: Type_487,
        minCreateBond: Type_487,
        maxPools: Type_488,
        maxMembers: Type_488,
        maxMembersPerPool: Type_488,
    }
})

/**
 * Call `withdraw_unbonded` for the pools account. This call can be made by any account.
 * 
 * This is useful if their are too many unlocking chunks to call `unbond`, and some
 * can be cleared by withdrawing. In the case there are too many unlocking chunks, the user
 * would probably see an error like `NoMoreChunks` emitted from the staking system when
 * they attempt to unbond.
 */
export type NominationPoolsPoolWithdrawUnbondedCall = {
    poolId: number,
    numSlashingSpans: number,
}

export const NominationPoolsPoolWithdrawUnbondedCall: sts.Type<NominationPoolsPoolWithdrawUnbondedCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        numSlashingSpans: sts.number(),
    }
})

export type NominationPoolsNominateCall = {
    poolId: number,
    validators: AccountId32[],
}

export const NominationPoolsNominateCall: sts.Type<NominationPoolsNominateCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        validators: sts.array(() => AccountId32),
    }
})

/**
 * Stake funds with a pool. The amount to bond is transferred from the member to the
 * pools account and immediately increases the pools bond.
 * 
 * # Note
 * 
 * * An account can only be a member of a single pool.
 * * An account cannot join the same pool multiple times.
 * * This call will *not* dust the member account, so the member must have at least
 *   `existential deposit + amount` in their account.
 * * Only a pool with [`PoolState::Open`] can be joined
 */
export type NominationPoolsJoinCall = {
    amount: bigint,
    poolId: number,
}

export const NominationPoolsJoinCall: sts.Type<NominationPoolsJoinCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
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
 * * `state_toggler` - The account to set as the [`PoolRoles::state_toggler`].
 * 
 * # Note
 * 
 * In addition to `amount`, the caller will transfer the existential deposit; so the caller
 * needs at have at least `amount + existential_deposit` transferrable.
 */
export type NominationPoolsCreateCall = {
    amount: bigint,
    root: AccountId32,
    nominator: AccountId32,
    stateToggler: AccountId32,
}

export const NominationPoolsCreateCall: sts.Type<NominationPoolsCreateCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        root: AccountId32,
        nominator: AccountId32,
        stateToggler: AccountId32,
    }
})

/**
 * A bonded member can use this to claim their payout based on the rewards that the pool
 * has accumulated since their last claimed payout (OR since joining if this is there first
 * time claiming rewards). The payout will be transferred to the member's account.
 * 
 * The member will earn rewards pro rata based on the members stake vs the sum of the
 * members in the pools stake. Rewards do not "expire".
 */
export type NominationPoolsClaimPayoutCall = null

export const NominationPoolsClaimPayoutCall: sts.Type<NominationPoolsClaimPayoutCall> = sts.unit()

/**
 * Bond `extra` more funds from `origin` into the pool to which they already belong.
 * 
 * Additional funds can come from either the free balance of the account, of from the
 * accumulated rewards, see [`BondExtra`].
 */
export type NominationPoolsBondExtraCall = {
    extra: BondExtra,
}

export const NominationPoolsBondExtraCall: sts.Type<NominationPoolsBondExtraCall> = sts.struct(() => {
    return  {
        extra: BondExtra,
    }
})

/**
 * A member has withdrawn from their pool.
 */
export type NominationPoolsWithdrawnEvent = {
    member: AccountId32,
    poolId: number,
    amount: bigint,
}

export const NominationPoolsWithdrawnEvent: sts.Type<NominationPoolsWithdrawnEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
        poolId: sts.number(),
        amount: sts.bigint(),
    }
})

/**
 * A member has unbonded from their pool.
 */
export type NominationPoolsUnbondedEvent = {
    member: AccountId32,
    poolId: number,
    amount: bigint,
}

export const NominationPoolsUnbondedEvent: sts.Type<NominationPoolsUnbondedEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
        poolId: sts.number(),
        amount: sts.bigint(),
    }
})

/**
 * The state of a pool has changed
 */
export type NominationPoolsStateChangedEvent = {
    poolId: number,
    newState: PoolState,
}

export const NominationPoolsStateChangedEvent: sts.Type<NominationPoolsStateChangedEvent> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        newState: PoolState,
    }
})

/**
 * The roles of a pool have been updated to the given new roles.
 */
export type NominationPoolsRolesUpdatedEvent = {
    root: AccountId32,
    stateToggler: AccountId32,
    nominator: AccountId32,
}

export const NominationPoolsRolesUpdatedEvent: sts.Type<NominationPoolsRolesUpdatedEvent> = sts.struct(() => {
    return  {
        root: AccountId32,
        stateToggler: AccountId32,
        nominator: AccountId32,
    }
})

/**
 * A payout has been made to a member.
 */
export type NominationPoolsPaidOutEvent = {
    member: AccountId32,
    poolId: number,
    payout: bigint,
}

export const NominationPoolsPaidOutEvent: sts.Type<NominationPoolsPaidOutEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
        poolId: sts.number(),
        payout: sts.bigint(),
    }
})

/**
 * A member has been removed from a pool.
 * 
 * The removal can be voluntary (withdrawn all unbonded funds) or involuntary (kicked).
 */
export type NominationPoolsMemberRemovedEvent = {
    poolId: number,
    member: AccountId32,
}

export const NominationPoolsMemberRemovedEvent: sts.Type<NominationPoolsMemberRemovedEvent> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        member: AccountId32,
    }
})

/**
 * A pool has been destroyed.
 */
export type NominationPoolsDestroyedEvent = {
    poolId: number,
}

export const NominationPoolsDestroyedEvent: sts.Type<NominationPoolsDestroyedEvent> = sts.struct(() => {
    return  {
        poolId: sts.number(),
    }
})

/**
 * A pool has been created.
 */
export type NominationPoolsCreatedEvent = {
    depositor: AccountId32,
    poolId: number,
}

export const NominationPoolsCreatedEvent: sts.Type<NominationPoolsCreatedEvent> = sts.struct(() => {
    return  {
        depositor: AccountId32,
        poolId: sts.number(),
    }
})

/**
 * A member has became bonded in a pool.
 */
export type NominationPoolsBondedEvent = {
    member: AccountId32,
    poolId: number,
    bonded: bigint,
    joined: boolean,
}

export const NominationPoolsBondedEvent: sts.Type<NominationPoolsBondedEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
        poolId: sts.number(),
        bonded: sts.bigint(),
        joined: sts.boolean(),
    }
})
