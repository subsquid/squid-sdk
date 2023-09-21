import {sts} from '../../pallet.support'
import {Id, HeadData, ValidationCode, AccountId32} from './types'

/**
 * Register head data and validation code for a reserved Para Id.
 * 
 * ## Arguments
 * - `origin`: Must be called by a `Signed` origin.
 * - `id`: The para ID. Must be owned/managed by the `origin` signing account.
 * - `genesis_head`: The genesis head data of the parachain/thread.
 * - `validation_code`: The initial validation code of the parachain/thread.
 * 
 * ## Deposits/Fees
 * The origin signed account must reserve a corresponding deposit for the registration. Anything already
 * reserved previously for this para ID is accounted for.
 * 
 * ## Events
 * The `Registered` event is emitted in case of success.
 */
export type RegistrarRegisterCall = {
    id: Id,
    genesisHead: HeadData,
    validationCode: ValidationCode,
}

export const RegistrarRegisterCall: sts.Type<RegistrarRegisterCall> = sts.struct(() => {
    return  {
        id: Id,
        genesisHead: HeadData,
        validationCode: ValidationCode,
    }
})

/**
 * Force the registration of a Para Id on the relay chain.
 * 
 * This function must be called by a Root origin.
 * 
 * The deposit taken can be specified for this registration. Any `ParaId`
 * can be registered, including sub-1000 IDs which are System Parachains.
 */
export type RegistrarForceRegisterCall = {
    who: AccountId32,
    deposit: bigint,
    id: Id,
    genesisHead: HeadData,
    validationCode: ValidationCode,
}

export const RegistrarForceRegisterCall: sts.Type<RegistrarForceRegisterCall> = sts.struct(() => {
    return  {
        who: AccountId32,
        deposit: sts.bigint(),
        id: Id,
        genesisHead: HeadData,
        validationCode: ValidationCode,
    }
})
