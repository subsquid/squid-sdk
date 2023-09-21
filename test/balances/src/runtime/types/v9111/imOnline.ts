import {sts} from '../../pallet.support'
import {Heartbeat} from './types'

/**
 * # <weight>
 * - Complexity: `O(K + E)` where K is length of `Keys` (heartbeat.validators_len) and E is
 *   length of `heartbeat.network_state.external_address`
 *   - `O(K)`: decoding of length `K`
 *   - `O(E)`: decoding/encoding of length `E`
 * - DbReads: pallet_session `Validators`, pallet_session `CurrentIndex`, `Keys`,
 *   `ReceivedHeartbeats`
 * - DbWrites: `ReceivedHeartbeats`
 * # </weight>
 */
export type ImOnlineHeartbeatCall = {
    heartbeat: Heartbeat,
    signature: Bytes,
}

export const ImOnlineHeartbeatCall: sts.Type<ImOnlineHeartbeatCall> = sts.struct(() => {
    return  {
        heartbeat: Heartbeat,
        signature: sts.bytes(),
    }
})
