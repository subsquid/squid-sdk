import {sts} from '../../pallet.support'
import {Id, Type_51} from './types'

/**
 * The result of trying to submit a new bid to the Slots pallet.
 */
export type CrowdloanHandleBidResultEvent = [Id, Type_51]

export const CrowdloanHandleBidResultEvent: sts.Type<CrowdloanHandleBidResultEvent> = sts.tuple(() => Id, Type_51)
