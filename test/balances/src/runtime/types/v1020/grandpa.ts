import {sts} from '../../pallet.support'
import {AuthorityList} from './types'

/**
 *  Report some misbehavior.
 */
export type GrandpaReportMisbehaviorCall = {
    _report: Bytes,
}

export const GrandpaReportMisbehaviorCall: sts.Type<GrandpaReportMisbehaviorCall> = sts.struct(() => {
    return  {
        _report: sts.bytes(),
    }
})

/**
 *  Current authority set has been resumed.
 */
export type GrandpaResumedEvent = null

export const GrandpaResumedEvent: sts.Type<GrandpaResumedEvent> = sts.unit()

/**
 *  Current authority set has been paused.
 */
export type GrandpaPausedEvent = null

export const GrandpaPausedEvent: sts.Type<GrandpaPausedEvent> = sts.unit()

/**
 *  New authority set has been applied.
 */
export type GrandpaNewAuthoritiesEvent = [AuthorityList]

export const GrandpaNewAuthoritiesEvent: sts.Type<GrandpaNewAuthoritiesEvent> = sts.tuple(() => AuthorityList)
