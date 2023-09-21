import {sts} from '../../pallet.support'
import {V3Outcome} from './types'

/**
 * Upward message executed with the given outcome.
 * \[ id, outcome \]
 */
export type UmpExecutedUpwardEvent = [Bytes, V3Outcome]

export const UmpExecutedUpwardEvent: sts.Type<UmpExecutedUpwardEvent> = sts.tuple(() => sts.bytes(), V3Outcome)
