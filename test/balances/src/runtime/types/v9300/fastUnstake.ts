import {sts} from '../../pallet.support'
import {AccountId32, Type_57} from './types'

/**
 * Register oneself for fast-unstake.
 * 
 * The dispatch origin of this call must be signed by the controller account, similar to
 * `staking::unbond`.
 * 
 * The stash associated with the origin must have no ongoing unlocking chunks. If
 * successful, this will fully unbond and chill the stash. Then, it will enqueue the stash
 * to be checked in further blocks.
 * 
 * If by the time this is called, the stash is actually eligible for fast-unstake, then
 * they are guaranteed to remain eligible, because the call will chill them as well.
 * 
 * If the check works, the entire staking data is removed, i.e. the stash is fully
 * unstaked.
 * 
 * If the check fails, the stash remains chilled and waiting for being unbonded as in with
 * the normal staking system, but they lose part of their unbonding chunks due to consuming
 * the chain's resources.
 */
export type FastUnstakeRegisterFastUnstakeCall = null

export const FastUnstakeRegisterFastUnstakeCall: sts.Type<FastUnstakeRegisterFastUnstakeCall> = sts.unit()

/**
 * Deregister oneself from the fast-unstake.
 * 
 * This is useful if one is registered, they are still waiting, and they change their mind.
 * 
 * Note that the associated stash is still fully unbonded and chilled as a consequence of
 * calling `register_fast_unstake`. This should probably be followed by a call to
 * `Staking::rebond`.
 */
export type FastUnstakeDeregisterCall = null

export const FastUnstakeDeregisterCall: sts.Type<FastUnstakeDeregisterCall> = sts.unit()

/**
 * Control the operation of this pallet.
 * 
 * Dispatch origin must be signed by the [`Config::ControlOrigin`].
 */
export type FastUnstakeControlCall = {
    uncheckedErasToCheck: number,
}

export const FastUnstakeControlCall: sts.Type<FastUnstakeControlCall> = sts.struct(() => {
    return  {
        uncheckedErasToCheck: sts.number(),
    }
})

/**
 * A staker was unstaked.
 */
export type FastUnstakeUnstakedEvent = {
    stash: AccountId32,
    result: Type_57,
}

export const FastUnstakeUnstakedEvent: sts.Type<FastUnstakeUnstakedEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
        result: Type_57,
    }
})

/**
 * A staker was slashed for requesting fast-unstake whilst being exposed.
 */
export type FastUnstakeSlashedEvent = {
    stash: AccountId32,
    amount: bigint,
}

export const FastUnstakeSlashedEvent: sts.Type<FastUnstakeSlashedEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * An internal error happened. Operations will be paused now.
 */
export type FastUnstakeInternalErrorEvent = null

export const FastUnstakeInternalErrorEvent: sts.Type<FastUnstakeInternalErrorEvent> = sts.unit()

/**
 * Some internal error happened while migrating stash. They are removed as head as a
 * consequence.
 */
export type FastUnstakeErroredEvent = {
    stash: AccountId32,
}

export const FastUnstakeErroredEvent: sts.Type<FastUnstakeErroredEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
    }
})

/**
 * A staker was partially checked for the given eras, but the process did not finish.
 */
export type FastUnstakeCheckingEvent = {
    stash: AccountId32,
    eras: number[],
}

export const FastUnstakeCheckingEvent: sts.Type<FastUnstakeCheckingEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
        eras: sts.array(() => sts.number()),
    }
})
