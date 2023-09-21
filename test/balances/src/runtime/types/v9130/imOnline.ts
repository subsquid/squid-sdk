import {sts} from '../../pallet.support'
import {AccountId32, Exposure} from './types'

/**
 * At the end of the session, at least one validator was found to be offline.
 */
export type ImOnlineSomeOfflineEvent = {
    offline: [AccountId32, Exposure][],
}

export const ImOnlineSomeOfflineEvent: sts.Type<ImOnlineSomeOfflineEvent> = sts.struct(() => {
    return  {
        offline: sts.array(() => sts.tuple(() => AccountId32, Exposure)),
    }
})

/**
 * A new heartbeat was received from `AuthorityId`.
 */
export type ImOnlineHeartbeatReceivedEvent = {
    authorityId: Bytes,
}

export const ImOnlineHeartbeatReceivedEvent: sts.Type<ImOnlineHeartbeatReceivedEvent> = sts.struct(() => {
    return  {
        authorityId: sts.bytes(),
    }
})
