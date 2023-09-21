import {sts} from '../../pallet.support'
import {Id, Type_462} from './types'

/**
 * The result of trying to submit a new bid to the Slots pallet.
 */
export type CrowdloanHandleBidResultEvent = {
    paraId: Id,
    result: Type_462,
}

export const CrowdloanHandleBidResultEvent: sts.Type<CrowdloanHandleBidResultEvent> = sts.struct(() => {
    return  {
        paraId: Id,
        result: Type_462,
    }
})
