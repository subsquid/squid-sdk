import {sts} from '../../pallet.support'
import {Id, Type_50} from './types'

/**
 * The result of trying to submit a new bid to the Slots pallet.
 */
export type CrowdloanHandleBidResultEvent = [Id, Type_50]

export const CrowdloanHandleBidResultEvent: sts.Type<CrowdloanHandleBidResultEvent> = sts.tuple(() => Id, Type_50)
