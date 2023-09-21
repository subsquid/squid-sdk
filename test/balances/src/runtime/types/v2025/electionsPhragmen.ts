import {sts} from '../../pallet.support'

/**
 *  Internal error happened while trying to perform election.
 */
export type ElectionsPhragmenElectionErrorEvent = null

export const ElectionsPhragmenElectionErrorEvent: sts.Type<ElectionsPhragmenElectionErrorEvent> = sts.unit()
