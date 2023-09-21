import {sts} from '../../pallet.support'
import {Heartbeat, Signature, IdentificationTuple, AuthorityId} from './types'

export type ImOnlineHeartbeatCall = {
    heartbeat: Heartbeat,
    _signature: Signature,
}

export const ImOnlineHeartbeatCall: sts.Type<ImOnlineHeartbeatCall> = sts.struct(() => {
    return  {
        heartbeat: Heartbeat,
        _signature: Signature,
    }
})

/**
 *  At the end of the session, at least once validator was found to be offline.
 */
export type ImOnlineSomeOfflineEvent = [IdentificationTuple[]]

export const ImOnlineSomeOfflineEvent: sts.Type<ImOnlineSomeOfflineEvent> = sts.tuple(() => sts.array(() => IdentificationTuple))

/**
 *  A new heartbeat was received from `AuthorityId`
 */
export type ImOnlineHeartbeatReceivedEvent = [AuthorityId]

export const ImOnlineHeartbeatReceivedEvent: sts.Type<ImOnlineHeartbeatReceivedEvent> = sts.tuple(() => AuthorityId)

/**
 *  At the end of the session, no offence was committed.
 */
export type ImOnlineAllGoodEvent = null

export const ImOnlineAllGoodEvent: sts.Type<ImOnlineAllGoodEvent> = sts.unit()
