import {sts} from '../../pallet.support'
import {Id} from './types'

/**
 * Some upward messages have been received and will be processed.
 */
export type ParaInclusionUpwardMessagesReceivedEvent = {
    from: Id,
    count: number,
}

export const ParaInclusionUpwardMessagesReceivedEvent: sts.Type<ParaInclusionUpwardMessagesReceivedEvent> = sts.struct(() => {
    return  {
        from: Id,
        count: sts.number(),
    }
})
