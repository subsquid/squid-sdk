import {sts} from '../../pallet.support'
import {ValidationCodeHash, V2PvfCheckStatement, ValidationCode, Id} from './types'

/**
 * Remove the validation code from the storage iff the reference count is 0.
 * 
 * This is better than removing the storage directly, because it will not remove the code
 * that was suddenly got used by some parachain while this dispatchable was pending
 * dispatching.
 */
export type ParasPokeUnusedValidationCodeCall = {
    validationCodeHash: ValidationCodeHash,
}

export const ParasPokeUnusedValidationCodeCall: sts.Type<ParasPokeUnusedValidationCodeCall> = sts.struct(() => {
    return  {
        validationCodeHash: ValidationCodeHash,
    }
})

/**
 * Includes a statement for a PVF pre-checking vote. Potentially, finalizes the vote and
 * enacts the results if that was the last vote before achieving the supermajority.
 */
export type ParasIncludePvfCheckStatementCall = {
    stmt: V2PvfCheckStatement,
    signature: Bytes,
}

export const ParasIncludePvfCheckStatementCall: sts.Type<ParasIncludePvfCheckStatementCall> = sts.struct(() => {
    return  {
        stmt: V2PvfCheckStatement,
        signature: sts.bytes(),
    }
})

/**
 * Adds the validation code to the storage.
 * 
 * The code will not be added if it is already present. Additionally, if PVF pre-checking
 * is running for that code, it will be instantly accepted.
 * 
 * Otherwise, the code will be added into the storage. Note that the code will be added
 * into storage with reference count 0. This is to account the fact that there are no users
 * for this code yet. The caller will have to make sure that this code eventually gets
 * used by some parachain or removed from the storage to avoid storage leaks. For the latter
 * prefer to use the `poke_unused_validation_code` dispatchable to raw storage manipulation.
 * 
 * This function is mainly meant to be used for upgrading parachains that do not follow
 * the go-ahead signal while the PVF pre-checking feature is enabled.
 */
export type ParasAddTrustedValidationCodeCall = {
    validationCode: ValidationCode,
}

export const ParasAddTrustedValidationCodeCall: sts.Type<ParasAddTrustedValidationCodeCall> = sts.struct(() => {
    return  {
        validationCode: ValidationCode,
    }
})

/**
 * The given para either initiated or subscribed to a PVF check for the given validation
 * code. `code_hash` `para_id`
 */
export type ParasPvfCheckStartedEvent = [ValidationCodeHash, Id]

export const ParasPvfCheckStartedEvent: sts.Type<ParasPvfCheckStartedEvent> = sts.tuple(() => ValidationCodeHash, Id)

/**
 * The given validation code was accepted by the PVF pre-checking vote.
 * `code_hash` `para_id`
 */
export type ParasPvfCheckRejectedEvent = [ValidationCodeHash, Id]

export const ParasPvfCheckRejectedEvent: sts.Type<ParasPvfCheckRejectedEvent> = sts.tuple(() => ValidationCodeHash, Id)

/**
 * The given validation code was rejected by the PVF pre-checking vote.
 * `code_hash` `para_id`
 */
export type ParasPvfCheckAcceptedEvent = [ValidationCodeHash, Id]

export const ParasPvfCheckAcceptedEvent: sts.Type<ParasPvfCheckAcceptedEvent> = sts.tuple(() => ValidationCodeHash, Id)
