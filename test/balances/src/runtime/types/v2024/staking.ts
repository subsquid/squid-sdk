import {sts} from '../../pallet.support'
import {AccountId} from './types'

/**
 *  Set the validators who cannot be slashed (if any).
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  - O(V)
 *  - Write: Invulnerables
 *  # </weight>
 */
export type StakingSetInvulnerablesCall = {
    invulnerables: AccountId[],
}

export const StakingSetInvulnerablesCall: sts.Type<StakingSetInvulnerablesCall> = sts.struct(() => {
    return  {
        invulnerables: sts.array(() => AccountId),
    }
})
