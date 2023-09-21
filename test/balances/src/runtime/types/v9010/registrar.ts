import {sts} from '../../pallet.support'
import {ParaId, HeadData, ValidationCode, AccountId, BalanceOf} from './types'

/**
 *  Swap a parachain with another parachain or parathread.
 * 
 *  The origin must be Root, the `para` owner, or the `para` itself.
 * 
 *  The swap will happen only if there is already an opposite swap pending. If there is not,
 *  the swap will be stored in the pending swaps map, ready for a later confirmatory swap.
 * 
 *  The `ParaId`s remain mapped to the same head data and code so external code can rely on
 *  `ParaId` to be a long-term identifier of a notional "parachain". However, their
 *  scheduling info (i.e. whether they're a parathread or parachain), auction information
 *  and the auction deposit are switched.
 */
export type RegistrarSwapCall = {
    id: ParaId,
    other: ParaId,
}

export const RegistrarSwapCall: sts.Type<RegistrarSwapCall> = sts.struct(() => {
    return  {
        id: ParaId,
        other: ParaId,
    }
})

/**
 *  Reserve a Para Id on the relay chain.
 * 
 *  This function will reserve a new Para Id to be owned/managed by the origin account.
 *  The origin account is able to register head data and validation code using `register` to create
 *  a parathread. Using the Slots pallet, a parathread can then be upgraded to get a parachain slot.
 * 
 *  ## Arguments
 *  - `origin`: Must be called by a `Signed` origin. Becomes the manager/owner of the new para ID.
 * 
 *  ## Deposits/Fees
 *  The origin must reserve a deposit of `ParaDeposit` for the registration.
 * 
 *  ## Events
 *  The `Reserved` event is emitted in case of success, which provides the ID reserved for use.
 */
export type RegistrarReserveCall = null

export const RegistrarReserveCall: sts.Type<RegistrarReserveCall> = sts.unit()

/**
 *  Register head data and validation code for a reserved Para Id.
 * 
 *  ## Arguments
 *  - `origin`: Must be called by a `Signed` origin.
 *  - `id`: The para ID. Must be owned/managed by the `origin` signing account.
 *  - `genesis_head`: The genesis head data of the parachain/thread.
 *  - `validation_code`: The initial validation code of the parachain/thread.
 * 
 *  ## Deposits/Fees
 *  The origin signed account must reserve a corresponding deposit for the registration. Anything already
 *  reserved previously for this para ID is accounted for.
 * 
 *  ## Events
 *  The `Registered` event is emitted in case of success.
 */
export type RegistrarRegisterCall = {
    id: ParaId,
    genesis_head: HeadData,
    validation_code: ValidationCode,
}

export const RegistrarRegisterCall: sts.Type<RegistrarRegisterCall> = sts.struct(() => {
    return  {
        id: ParaId,
        genesis_head: HeadData,
        validation_code: ValidationCode,
    }
})

/**
 *  Remove a manager lock from a para. This will allow the manager of a
 *  previously locked para to deregister or swap a para without using governance.
 * 
 *  Can only be called by the Root origin.
 */
export type RegistrarForceRemoveLockCall = {
    para: ParaId,
}

export const RegistrarForceRemoveLockCall: sts.Type<RegistrarForceRemoveLockCall> = sts.struct(() => {
    return  {
        para: ParaId,
    }
})

/**
 *  Force the registration of a Para Id on the relay chain.
 * 
 *  This function must be called by a Root origin.
 * 
 *  The deposit taken can be specified for this registration. Any ParaId
 *  can be registered, including sub-1000 IDs which are System Parachains.
 */
export type RegistrarForceRegisterCall = {
    who: AccountId,
    deposit: BalanceOf,
    id: ParaId,
    genesis_head: HeadData,
    validation_code: ValidationCode,
}

export const RegistrarForceRegisterCall: sts.Type<RegistrarForceRegisterCall> = sts.struct(() => {
    return  {
        who: AccountId,
        deposit: BalanceOf,
        id: ParaId,
        genesis_head: HeadData,
        validation_code: ValidationCode,
    }
})

/**
 *  Deregister a Para Id, freeing all data and returning any deposit.
 * 
 *  The caller must be Root, the `para` owner, or the `para` itself. The para must be a parathread.
 */
export type RegistrarDeregisterCall = {
    id: ParaId,
}

export const RegistrarDeregisterCall: sts.Type<RegistrarDeregisterCall> = sts.struct(() => {
    return  {
        id: ParaId,
    }
})

export type RegistrarReservedEvent = [ParaId, AccountId]

export const RegistrarReservedEvent: sts.Type<RegistrarReservedEvent> = sts.tuple(() => ParaId, AccountId)

export type RegistrarRegisteredEvent = [ParaId, AccountId]

export const RegistrarRegisteredEvent: sts.Type<RegistrarRegisteredEvent> = sts.tuple(() => ParaId, AccountId)

export type RegistrarDeregisteredEvent = [ParaId]

export const RegistrarDeregisteredEvent: sts.Type<RegistrarDeregisteredEvent> = sts.tuple(() => ParaId)
