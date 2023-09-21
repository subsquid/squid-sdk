import {sts} from '../../pallet.support'
import {Type_487, AccountId32} from './types'

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
    newRoot: Type_487,
    newNominator: Type_487,
    newStateToggler: Type_487,
}

export const NominationPoolsUpdateRolesCall: sts.Type<NominationPoolsUpdateRolesCall> = sts.struct(() => {
    return  {
        poolId: sts.number(),
        newRoot: Type_487,
        newNominator: Type_487,
        newStateToggler: Type_487,
    }
})

/**
 * The roles of a pool have been updated to the given new roles. Note that the depositor
 * can never change.
 */
export type NominationPoolsRolesUpdatedEvent = {
    root?: (AccountId32 | undefined),
    stateToggler?: (AccountId32 | undefined),
    nominator?: (AccountId32 | undefined),
}

export const NominationPoolsRolesUpdatedEvent: sts.Type<NominationPoolsRolesUpdatedEvent> = sts.struct(() => {
    return  {
        root: sts.option(() => AccountId32),
        stateToggler: sts.option(() => AccountId32),
        nominator: sts.option(() => AccountId32),
    }
})
