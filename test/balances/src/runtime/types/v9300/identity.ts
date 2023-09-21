import {sts} from '../../pallet.support'
import {MultiAddress, Judgement, H256} from './types'

/**
 * Provide a judgement for an account's identity.
 * 
 * The dispatch origin for this call must be _Signed_ and the sender must be the account
 * of the registrar whose index is `reg_index`.
 * 
 * - `reg_index`: the index of the registrar whose judgement is being made.
 * - `target`: the account whose identity the judgement is upon. This must be an account
 *   with a registered identity.
 * - `judgement`: the judgement of the registrar of index `reg_index` about `target`.
 * - `identity`: The hash of the [`IdentityInfo`] for that the judgement is provided.
 * 
 * Emits `JudgementGiven` if successful.
 * 
 * # <weight>
 * - `O(R + X)`.
 * - One balance-transfer operation.
 * - Up to one account-lookup operation.
 * - Storage: 1 read `O(R)`, 1 mutate `O(R + X)`.
 * - One event.
 * # </weight>
 */
export type IdentityProvideJudgementCall = {
    regIndex: number,
    target: MultiAddress,
    judgement: Judgement,
    identity: H256,
}

export const IdentityProvideJudgementCall: sts.Type<IdentityProvideJudgementCall> = sts.struct(() => {
    return  {
        regIndex: sts.number(),
        target: MultiAddress,
        judgement: Judgement,
        identity: H256,
    }
})
