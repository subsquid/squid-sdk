import {sts} from '../../pallet.support'

/**
 *  A new set of stakers was elected.
 */
export type StakingStakingElectionEvent = null

export const StakingStakingElectionEvent: sts.Type<StakingStakingElectionEvent> = sts.unit()
