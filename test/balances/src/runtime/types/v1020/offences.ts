import {sts} from '../../pallet.support'
import {Kind, OpaqueTimeSlot} from './types'

/**
 *  There is an offence reported of the given `kind` happened at the `session_index` and
 *  (kind-specific) time slot. This event is not deposited for duplicate slashes.
 */
export type OffencesOffenceEvent = [Kind, OpaqueTimeSlot]

export const OffencesOffenceEvent: sts.Type<OffencesOffenceEvent> = sts.tuple(() => Kind, OpaqueTimeSlot)
