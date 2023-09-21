import {sts} from '../../pallet.support'
import {EthereumAddress, AccountId32, StatementKind, EcdsaSignature} from './types'

export type ClaimsMoveClaimCall = {
    old: EthereumAddress,
    new: EthereumAddress,
    maybePreclaim?: (AccountId32 | undefined),
}

export const ClaimsMoveClaimCall: sts.Type<ClaimsMoveClaimCall> = sts.struct(() => {
    return  {
        old: EthereumAddress,
        new: EthereumAddress,
        maybePreclaim: sts.option(() => AccountId32),
    }
})

/**
 * Mint a new claim to collect DOTs.
 * 
 * The dispatch origin for this call must be _Root_.
 * 
 * Parameters:
 * - `who`: The Ethereum address allowed to collect this claim.
 * - `value`: The number of DOTs that will be claimed.
 * - `vesting_schedule`: An optional vesting schedule for these DOTs.
 * 
 * <weight>
 * The weight of this call is invariant over the input parameters.
 * We assume worst case that both vesting and statement is being inserted.
 * 
 * Total Complexity: O(1)
 * </weight>
 */
export type ClaimsMintClaimCall = {
    who: EthereumAddress,
    value: bigint,
    vestingSchedule?: ([bigint, bigint, number] | undefined),
    statement?: (StatementKind | undefined),
}

export const ClaimsMintClaimCall: sts.Type<ClaimsMintClaimCall> = sts.struct(() => {
    return  {
        who: EthereumAddress,
        value: sts.bigint(),
        vestingSchedule: sts.option(() => sts.tuple(() => sts.bigint(), sts.bigint(), sts.number())),
        statement: sts.option(() => StatementKind),
    }
})

/**
 * Make a claim to collect your DOTs by signing a statement.
 * 
 * The dispatch origin for this call must be _None_.
 * 
 * Unsigned Validation:
 * A call to `claim_attest` is deemed valid if the signature provided matches
 * the expected signed message of:
 * 
 * > Ethereum Signed Message:
 * > (configured prefix string)(address)(statement)
 * 
 * and `address` matches the `dest` account; the `statement` must match that which is
 * expected according to your purchase arrangement.
 * 
 * Parameters:
 * - `dest`: The destination account to payout the claim.
 * - `ethereum_signature`: The signature of an ethereum signed message
 *    matching the format described above.
 * - `statement`: The identity of the statement which is being attested to in the signature.
 * 
 * <weight>
 * The weight of this call is invariant over the input parameters.
 * Weight includes logic to validate unsigned `claim_attest` call.
 * 
 * Total Complexity: O(1)
 * </weight>
 */
export type ClaimsClaimAttestCall = {
    dest: AccountId32,
    ethereumSignature: EcdsaSignature,
    statement: Bytes,
}

export const ClaimsClaimAttestCall: sts.Type<ClaimsClaimAttestCall> = sts.struct(() => {
    return  {
        dest: AccountId32,
        ethereumSignature: EcdsaSignature,
        statement: sts.bytes(),
    }
})

/**
 * Make a claim to collect your DOTs.
 * 
 * The dispatch origin for this call must be _None_.
 * 
 * Unsigned Validation:
 * A call to claim is deemed valid if the signature provided matches
 * the expected signed message of:
 * 
 * > Ethereum Signed Message:
 * > (configured prefix string)(address)
 * 
 * and `address` matches the `dest` account.
 * 
 * Parameters:
 * - `dest`: The destination account to payout the claim.
 * - `ethereum_signature`: The signature of an ethereum signed message
 *    matching the format described above.
 * 
 * <weight>
 * The weight of this call is invariant over the input parameters.
 * Weight includes logic to validate unsigned `claim` call.
 * 
 * Total Complexity: O(1)
 * </weight>
 */
export type ClaimsClaimCall = {
    dest: AccountId32,
    ethereumSignature: EcdsaSignature,
}

export const ClaimsClaimCall: sts.Type<ClaimsClaimCall> = sts.struct(() => {
    return  {
        dest: AccountId32,
        ethereumSignature: EcdsaSignature,
    }
})
