import {sts} from '../../pallet.support'
import {HrmpChannelId, Id} from './types'

/**
 * This cancels a pending open channel request. It can be canceled by either of the sender
 * or the recipient for that request. The origin must be either of those.
 * 
 * The cancellation happens immediately. It is not possible to cancel the request if it is
 * already accepted.
 * 
 * Total number of open requests (i.e. `HrmpOpenChannelRequestsList`) must be provided as
 * witness data.
 */
export type HrmpHrmpCancelOpenRequestCall = {
    channelId: HrmpChannelId,
    openRequests: number,
}

export const HrmpHrmpCancelOpenRequestCall: sts.Type<HrmpHrmpCancelOpenRequestCall> = sts.struct(() => {
    return  {
        channelId: HrmpChannelId,
        openRequests: sts.number(),
    }
})

/**
 * Force process HRMP open channel requests.
 * 
 * If there are pending HRMP open channel requests, you can use this
 * function process all of those requests immediately.
 * 
 * Total number of opening channels must be provided as witness data of weighing.
 */
export type HrmpForceProcessHrmpOpenCall = {
    channels: number,
}

export const HrmpForceProcessHrmpOpenCall: sts.Type<HrmpForceProcessHrmpOpenCall> = sts.struct(() => {
    return  {
        channels: sts.number(),
    }
})

/**
 * Force process HRMP close channel requests.
 * 
 * If there are pending HRMP close channel requests, you can use this
 * function process all of those requests immediately.
 * 
 * Total number of closing channels must be provided as witness data of weighing.
 */
export type HrmpForceProcessHrmpCloseCall = {
    channels: number,
}

export const HrmpForceProcessHrmpCloseCall: sts.Type<HrmpForceProcessHrmpCloseCall> = sts.struct(() => {
    return  {
        channels: sts.number(),
    }
})

/**
 * This extrinsic triggers the cleanup of all the HRMP storage items that
 * a para may have. Normally this happens once per session, but this allows
 * you to trigger the cleanup immediately for a specific parachain.
 * 
 * Origin must be Root.
 * 
 * Number of inbound and outbound channels for `para` must be provided as witness data of weighing.
 */
export type HrmpForceCleanHrmpCall = {
    para: Id,
    inbound: number,
    outbound: number,
}

export const HrmpForceCleanHrmpCall: sts.Type<HrmpForceCleanHrmpCall> = sts.struct(() => {
    return  {
        para: Id,
        inbound: sts.number(),
        outbound: sts.number(),
    }
})
