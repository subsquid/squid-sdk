import {sts} from '../../pallet.support'
import {MessageId, Weight, ParaId, Outcome} from './types'

/**
 *  The weight limit for handling downward messages was reached.
 *  \[ id, remaining, required \]
 */
export type ParasUmpWeightExhaustedEvent = [MessageId, Weight, Weight]

export const ParasUmpWeightExhaustedEvent: sts.Type<ParasUmpWeightExhaustedEvent> = sts.tuple(() => MessageId, Weight, Weight)

/**
 *  Some downward messages have been received and will be processed.
 *  \[ para, count, size \]
 */
export type ParasUmpUpwardMessagesReceivedEvent = [ParaId, number, number]

export const ParasUmpUpwardMessagesReceivedEvent: sts.Type<ParasUmpUpwardMessagesReceivedEvent> = sts.tuple(() => ParaId, sts.number(), sts.number())

/**
 *  Upward message is unsupported version of XCM.
 *  \[ id \]
 */
export type ParasUmpUnsupportedVersionEvent = [MessageId]

export const ParasUmpUnsupportedVersionEvent: sts.Type<ParasUmpUnsupportedVersionEvent> = sts.tuple(() => MessageId)

/**
 *  Upward message is invalid XCM.
 *  \[ id \]
 */
export type ParasUmpInvalidFormatEvent = [MessageId]

export const ParasUmpInvalidFormatEvent: sts.Type<ParasUmpInvalidFormatEvent> = sts.tuple(() => MessageId)

/**
 *  Upward message executed with the given outcome.
 *  \[ id, outcome \]
 */
export type ParasUmpExecutedUpwardEvent = [MessageId, Outcome]

export const ParasUmpExecutedUpwardEvent: sts.Type<ParasUmpExecutedUpwardEvent> = sts.tuple(() => MessageId, Outcome)
