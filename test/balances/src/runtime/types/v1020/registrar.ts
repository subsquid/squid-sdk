import {sts} from '../../pallet.support'
import {CollatorId, Hash, ParaInfo, ParaId} from './types'

/**
 *  Swap a parachain with another parachain or parathread. The origin must be a `Parachain`.
 *  The swap will happen only if there is already an opposite swap pending. If there is not,
 *  the swap will be stored in the pending swaps map, ready for a later confirmatory swap.
 * 
 *  The `ParaId`s remain mapped to the same head data and code so external code can rely on
 *  `ParaId` to be a long-term identifier of a notional "parachain". However, their
 *  scheduling info (i.e. whether they're a parathread or parachain), auction information
 *  and the auction deposit are switched.
 */
export type RegistrarSwapCall = {
    other: number,
}

export const RegistrarSwapCall: sts.Type<RegistrarSwapCall> = sts.struct(() => {
    return  {
        other: sts.number(),
    }
})

/**
 *  Reset the number of parathreads that can pay to be scheduled in a single block.
 * 
 *  - `count`: The number of parathreads.
 * 
 *  Must be called from Root origin.
 */
export type RegistrarSetThreadCountCall = {
    count: number,
}

export const RegistrarSetThreadCountCall: sts.Type<RegistrarSetThreadCountCall> = sts.struct(() => {
    return  {
        count: sts.number(),
    }
})

/**
 *  Place a bid for a parathread to be progressed in the next block.
 * 
 *  This is a kind of special transaction that should by heavily prioritized in the
 *  transaction pool according to the `value`; only `ThreadCount` of them may be presented
 *  in any single block.
 */
export type RegistrarSelectParathreadCall = {
    _id: number,
    _collator: CollatorId,
    _head_hash: Hash,
}

export const RegistrarSelectParathreadCall: sts.Type<RegistrarSelectParathreadCall> = sts.struct(() => {
    return  {
        _id: sts.number(),
        _collator: CollatorId,
        _head_hash: Hash,
    }
})

/**
 *  Register a parathread for immediate use.
 * 
 *  Must be sent from a Signed origin that is able to have ParathreadDeposit reserved.
 *  `code` and `initial_head_data` are used to initialize the parathread's state.
 */
export type RegistrarRegisterParathreadCall = {
    code: Bytes,
    initial_head_data: Bytes,
}

export const RegistrarRegisterParathreadCall: sts.Type<RegistrarRegisterParathreadCall> = sts.struct(() => {
    return  {
        code: sts.bytes(),
        initial_head_data: sts.bytes(),
    }
})

/**
 *  Register a parachain with given code.
 *  Fails if given ID is already used.
 */
export type RegistrarRegisterParaCall = {
    id: number,
    info: ParaInfo,
    code: Bytes,
    initial_head_data: Bytes,
}

export const RegistrarRegisterParaCall: sts.Type<RegistrarRegisterParaCall> = sts.struct(() => {
    return  {
        id: sts.number(),
        info: ParaInfo,
        code: sts.bytes(),
        initial_head_data: sts.bytes(),
    }
})

/**
 *  Deregister a parathread and retrieve the deposit.
 * 
 *  Must be sent from a `Parachain` origin which is currently a parathread.
 * 
 *  Ensure that before calling this that any funds you want emptied from the parathread's
 *  account is moved out; after this it will be impossible to retrieve them (without
 *  governance intervention).
 */
export type RegistrarDeregisterParathreadCall = null

export const RegistrarDeregisterParathreadCall: sts.Type<RegistrarDeregisterParathreadCall> = sts.unit()

/**
 *  Deregister a parachain with given id
 */
export type RegistrarDeregisterParaCall = {
    id: number,
}

export const RegistrarDeregisterParaCall: sts.Type<RegistrarDeregisterParaCall> = sts.struct(() => {
    return  {
        id: sts.number(),
    }
})

/**
 *  A parathread was registered; its new ID is supplied.
 */
export type RegistrarParathreadRegisteredEvent = [ParaId]

export const RegistrarParathreadRegisteredEvent: sts.Type<RegistrarParathreadRegisteredEvent> = sts.tuple(() => ParaId)

/**
 *  The parathread of the supplied ID was de-registered.
 */
export type RegistrarParathreadDeregisteredEvent = [ParaId]

export const RegistrarParathreadDeregisteredEvent: sts.Type<RegistrarParathreadDeregisteredEvent> = sts.tuple(() => ParaId)
