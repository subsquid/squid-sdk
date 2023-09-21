import {sts} from '../../pallet.support'
import {V2Outcome} from './types'

/**
 * Upward message executed with the given outcome.
 * \[ id, outcome \]
 */
export type UmpExecutedUpwardEvent = [Bytes, V2Outcome]

export const UmpExecutedUpwardEvent: sts.Type<UmpExecutedUpwardEvent> = sts.tuple(() => sts.bytes(), V2Outcome)
