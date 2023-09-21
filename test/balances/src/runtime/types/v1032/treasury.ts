import {sts} from '../../pallet.support'
import {ProposalIndex, Balance} from './types'

/**
 *  A proposal was rejected; funds were slashed.
 */
export type TreasuryRejectedEvent = [ProposalIndex, Balance]

export const TreasuryRejectedEvent: sts.Type<TreasuryRejectedEvent> = sts.tuple(() => ProposalIndex, Balance)
