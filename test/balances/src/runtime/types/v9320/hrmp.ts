import {sts} from '../../pallet.support'
import {Id} from './types'

/**
 * Open a channel from a `sender` to a `recipient` `ParaId` using the Root origin. Although
 * opened by Root, the `max_capacity` and `max_message_size` are still subject to the Relay
 * Chain's configured limits.
 * 
 * Expected use is when one of the `ParaId`s involved in the channel is governed by the
 * Relay Chain, e.g. a common good parachain.
 */
export type HrmpForceOpenHrmpChannelCall = {
    sender: Id,
    recipient: Id,
    maxCapacity: number,
    maxMessageSize: number,
}

export const HrmpForceOpenHrmpChannelCall: sts.Type<HrmpForceOpenHrmpChannelCall> = sts.struct(() => {
    return  {
        sender: Id,
        recipient: Id,
        maxCapacity: sts.number(),
        maxMessageSize: sts.number(),
    }
})

/**
 * An HRMP channel was opened via Root origin.
 * `[sender, recipient, proposed_max_capacity, proposed_max_message_size]`
 */
export type HrmpHrmpChannelForceOpenedEvent = [Id, Id, number, number]

export const HrmpHrmpChannelForceOpenedEvent: sts.Type<HrmpHrmpChannelForceOpenedEvent> = sts.tuple(() => Id, Id, sts.number(), sts.number())
