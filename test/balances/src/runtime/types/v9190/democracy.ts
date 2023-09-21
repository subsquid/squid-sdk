import {sts} from '../../pallet.support'
import {Type_51} from './types'

/**
 * A proposal has been enacted.
 */
export type DemocracyExecutedEvent = {
    refIndex: number,
    result: Type_51,
}

export const DemocracyExecutedEvent: sts.Type<DemocracyExecutedEvent> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
        result: Type_51,
    }
})
