import {sts} from '../../pallet.support'
import {HrmpChannelId, ParaId} from './types'

/**
 *  This cancels a pending open channel request. It can be canceled be either of the sender
 *  or the recipient for that request. The origin must be either of those.
 * 
 *  The cancelling happens immediately. It is not possible to cancel the request if it is
 *  already accepted.
 */
export type HrmpHrmpCancelOpenRequestCall = {
    channel_id: HrmpChannelId,
}

export const HrmpHrmpCancelOpenRequestCall: sts.Type<HrmpHrmpCancelOpenRequestCall> = sts.struct(() => {
    return  {
        channel_id: HrmpChannelId,
    }
})

/**
 *  An HRMP channel request sent by the receiver was canceled by either party.
 *  `[by_parachain, channel_id]`
 */
export type HrmpOpenChannelCanceledEvent = [ParaId, HrmpChannelId]

export const HrmpOpenChannelCanceledEvent: sts.Type<HrmpOpenChannelCanceledEvent> = sts.tuple(() => ParaId, HrmpChannelId)
