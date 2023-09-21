import {sts} from '../../pallet.support'
import {LookupSource} from './types'

/**
 *  Put forward a suggestion for spending. A deposit proportional to the value
 *  is reserved and slashed if the proposal is rejected. It is returned once the
 *  proposal is awarded.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB change, one extra DB entry.
 *  # </weight>
 */
export type TreasuryProposeSpendCall = {
    value: bigint,
    beneficiary: LookupSource,
}

export const TreasuryProposeSpendCall: sts.Type<TreasuryProposeSpendCall> = sts.struct(() => {
    return  {
        value: sts.bigint(),
        beneficiary: LookupSource,
    }
})
