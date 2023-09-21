import {sts} from '../../pallet.support'
import {Heartbeat, Signature} from './types'

/**
 *  # <weight>
 *  - Complexity: `O(K + E)` where K is length of `Keys` and E is length of
 *    `Heartbeat.network_state.external_address`
 * 
 *    - `O(K)`: decoding of length `K`
 *    - `O(E)`: decoding/encoding of length `E`
 *  - DbReads: pallet_session `Validators`, pallet_session `CurrentIndex`, `Keys`,
 *    `ReceivedHeartbeats`
 *  - DbWrites: `ReceivedHeartbeats`
 *  # </weight>
 */
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
