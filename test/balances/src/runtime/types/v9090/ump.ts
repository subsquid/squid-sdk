import {sts} from '../../pallet.support'
import {MessageId, Weight, ParaId, Outcome} from './types'

/**
 *  The weight limit for handling downward messages was reached.
 *  \[ id, remaining, required \]
 */
export type UmpWeightExhaustedEvent = [MessageId, Weight, Weight]

export const UmpWeightExhaustedEvent: sts.Type<UmpWeightExhaustedEvent> = sts.tuple(() => MessageId, Weight, Weight)

/**
 *  Some downward messages have been received and will be processed.
 *  \[ para, count, size \]
 */
export type UmpUpwardMessagesReceivedEvent = [ParaId, number, number]

export const UmpUpwardMessagesReceivedEvent: sts.Type<UmpUpwardMessagesReceivedEvent> = sts.tuple(() => ParaId, sts.number(), sts.number())

/**
 *  Upward message is unsupported version of XCM.
 *  \[ id \]
 */
export type UmpUnsupportedVersionEvent = [MessageId]

export const UmpUnsupportedVersionEvent: sts.Type<UmpUnsupportedVersionEvent> = sts.tuple(() => MessageId)

/**
 *  Upward message is invalid XCM.
 *  \[ id \]
 */
export type UmpInvalidFormatEvent = [MessageId]

export const UmpInvalidFormatEvent: sts.Type<UmpInvalidFormatEvent> = sts.tuple(() => MessageId)

/**
 *  Upward message executed with the given outcome.
 *  \[ id, outcome \]
 */
export type UmpExecutedUpwardEvent = [MessageId, Outcome]

export const UmpExecutedUpwardEvent: sts.Type<UmpExecutedUpwardEvent> = sts.tuple(() => MessageId, Outcome)
