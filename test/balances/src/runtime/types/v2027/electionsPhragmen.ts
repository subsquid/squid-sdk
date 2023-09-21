import {sts} from '../../pallet.support'
import {AccountId, Balance} from './types'

/**
 *  A seat holder (member or runner-up) was slashed due to failing to retaining their position.
 */
export type ElectionsPhragmenSeatHolderSlashedEvent = [AccountId, Balance]

export const ElectionsPhragmenSeatHolderSlashedEvent: sts.Type<ElectionsPhragmenSeatHolderSlashedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  A candidate was slashed due to failing to obtain a seat as member or runner-up
 */
export type ElectionsPhragmenCandidateSlashedEvent = [AccountId, Balance]

export const ElectionsPhragmenCandidateSlashedEvent: sts.Type<ElectionsPhragmenCandidateSlashedEvent> = sts.tuple(() => AccountId, Balance)
