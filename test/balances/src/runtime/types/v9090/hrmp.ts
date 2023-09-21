import {sts} from '../../pallet.support'
import {ParaId, HrmpChannelId} from './types'

/**
 *  Initiate opening a channel from a parachain to a given recipient with given channel
 *  parameters.
 * 
 *  - `proposed_max_capacity` - specifies how many messages can be in the channel at once.
 *  - `proposed_max_message_size` - specifies the maximum size of any of the messages.
 * 
 *  These numbers are a subject to the relay-chain configuration limits.
 * 
 *  The channel can be opened only after the recipient confirms it and only on a session
 *  change.
 */
export type HrmpHrmpInitOpenChannelCall = {
    recipient: ParaId,
    proposed_max_capacity: number,
    proposed_max_message_size: number,
}

export const HrmpHrmpInitOpenChannelCall: sts.Type<HrmpHrmpInitOpenChannelCall> = sts.struct(() => {
    return  {
        recipient: ParaId,
        proposed_max_capacity: sts.number(),
        proposed_max_message_size: sts.number(),
    }
})

/**
 *  Initiate unilateral closing of a channel. The origin must be either the sender or the
 *  recipient in the channel being closed.
 * 
 *  The closure can only happen on a session change.
 */
export type HrmpHrmpCloseChannelCall = {
    channel_id: HrmpChannelId,
}

export const HrmpHrmpCloseChannelCall: sts.Type<HrmpHrmpCloseChannelCall> = sts.struct(() => {
    return  {
        channel_id: HrmpChannelId,
    }
})

/**
 *  Accept a pending open channel request from the given sender.
 * 
 *  The channel will be opened only on the next session boundary.
 */
export type HrmpHrmpAcceptOpenChannelCall = {
    sender: ParaId,
}

export const HrmpHrmpAcceptOpenChannelCall: sts.Type<HrmpHrmpAcceptOpenChannelCall> = sts.struct(() => {
    return  {
        sender: ParaId,
    }
})

/**
 *  Force process HRMP open channel requests.
 * 
 *  If there are pending HRMP open channel requests, you can use this
 *  function process all of those requests immediately.
 */
export type HrmpForceProcessHrmpOpenCall = null

export const HrmpForceProcessHrmpOpenCall: sts.Type<HrmpForceProcessHrmpOpenCall> = sts.unit()

/**
 *  Force process HRMP close channel requests.
 * 
 *  If there are pending HRMP close channel requests, you can use this
 *  function process all of those requests immediately.
 */
export type HrmpForceProcessHrmpCloseCall = null

export const HrmpForceProcessHrmpCloseCall: sts.Type<HrmpForceProcessHrmpCloseCall> = sts.unit()

/**
 *  This extrinsic triggers the cleanup of all the HRMP storage items that
 *  a para may have. Normally this happens once per session, but this allows
 *  you to trigger the cleanup immediately for a specific parachain.
 * 
 *  Origin must be Root.
 */
export type HrmpForceCleanHrmpCall = {
    para: ParaId,
}

export const HrmpForceCleanHrmpCall: sts.Type<HrmpForceCleanHrmpCall> = sts.struct(() => {
    return  {
        para: ParaId,
    }
})

/**
 *  Open HRMP channel requested.
 *  `[sender, recipient, proposed_max_capacity, proposed_max_message_size]`
 */
export type HrmpOpenChannelRequestedEvent = [ParaId, ParaId, number, number]

export const HrmpOpenChannelRequestedEvent: sts.Type<HrmpOpenChannelRequestedEvent> = sts.tuple(() => ParaId, ParaId, sts.number(), sts.number())

/**
 *  Open HRMP channel accepted. `[sender, recipient]`
 */
export type HrmpOpenChannelAcceptedEvent = [ParaId, ParaId]

export const HrmpOpenChannelAcceptedEvent: sts.Type<HrmpOpenChannelAcceptedEvent> = sts.tuple(() => ParaId, ParaId)

/**
 *  HRMP channel closed. `[by_parachain, channel_id]`
 */
export type HrmpChannelClosedEvent = [ParaId, HrmpChannelId]

export const HrmpChannelClosedEvent: sts.Type<HrmpChannelClosedEvent> = sts.tuple(() => ParaId, HrmpChannelId)
