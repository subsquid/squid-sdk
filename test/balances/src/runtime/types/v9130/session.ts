import {sts} from '../../pallet.support'

/**
 * New session has happened. Note that the argument is the session index, not the
 * block number as the type might suggest.
 */
export type SessionNewSessionEvent = {
    sessionIndex: number,
}

export const SessionNewSessionEvent: sts.Type<SessionNewSessionEvent> = sts.struct(() => {
    return  {
        sessionIndex: sts.number(),
    }
})
