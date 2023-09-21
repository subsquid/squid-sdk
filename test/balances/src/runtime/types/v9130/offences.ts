import {sts} from '../../pallet.support'

/**
 * There is an offence reported of the given `kind` happened at the `session_index` and
 * (kind-specific) time slot. This event is not deposited for duplicate slashes.
 * \[kind, timeslot\].
 */
export type OffencesOffenceEvent = {
    kind: Bytes,
    timeslot: Bytes,
}

export const OffencesOffenceEvent: sts.Type<OffencesOffenceEvent> = sts.struct(() => {
    return  {
        kind: sts.bytes(),
        timeslot: sts.bytes(),
    }
})
