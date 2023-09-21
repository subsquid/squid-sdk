import {sts} from '../../pallet.support'
import {Id, HrmpChannelId} from './types'

/**
 * Initiate opening a channel from a parachain to a given recipient with given channel
 * parameters.
 * 
 * - `proposed_max_capacity` - specifies how many messages can be in the channel at once.
 * - `proposed_max_message_size` - specifies the maximum size of the messages.
 * 
 * These numbers are a subject to the relay-chain configuration limits.
 * 
 * The channel can be opened only after the recipient confirms it and only on a session
 * change.
 */
export type HrmpHrmpInitOpenChannelCall = {
    recipient: Id,
    proposedMaxCapacity: number,
    proposedMaxMessageSize: number,
}

export const HrmpHrmpInitOpenChannelCall: sts.Type<HrmpHrmpInitOpenChannelCall> = sts.struct(() => {
    return  {
        recipient: Id,
        proposedMaxCapacity: sts.number(),
        proposedMaxMessageSize: sts.number(),
    }
})

/**
 * Initiate unilateral closing of a channel. The origin must be either the sender or the
 * recipient in the channel being closed.
 * 
 * The closure can only happen on a session change.
 */
export type HrmpHrmpCloseChannelCall = {
    channelId: HrmpChannelId,
}

export const HrmpHrmpCloseChannelCall: sts.Type<HrmpHrmpCloseChannelCall> = sts.struct(() => {
    return  {
        channelId: HrmpChannelId,
    }
})

/**
 * This cancels a pending open channel request. It can be canceled be either of the sender
 * or the recipient for that request. The origin must be either of those.
 * 
 * The cancelling happens immediately. It is not possible to cancel the request if it is
 * already accepted.
 */
export type HrmpHrmpCancelOpenRequestCall = {
    channelId: HrmpChannelId,
}

export const HrmpHrmpCancelOpenRequestCall: sts.Type<HrmpHrmpCancelOpenRequestCall> = sts.struct(() => {
    return  {
        channelId: HrmpChannelId,
    }
})

/**
 * An HRMP channel request sent by the receiver was canceled by either party.
 * `[by_parachain, channel_id]`
 */
export type HrmpOpenChannelCanceledEvent = [Id, HrmpChannelId]

export const HrmpOpenChannelCanceledEvent: sts.Type<HrmpOpenChannelCanceledEvent> = sts.tuple(() => Id, HrmpChannelId)

/**
 * HRMP channel closed. `[by_parachain, channel_id]`
 */
export type HrmpChannelClosedEvent = [Id, HrmpChannelId]

export const HrmpChannelClosedEvent: sts.Type<HrmpChannelClosedEvent> = sts.tuple(() => Id, HrmpChannelId)
