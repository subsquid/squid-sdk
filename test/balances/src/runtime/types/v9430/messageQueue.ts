import {sts} from '../../pallet.support'
import {AggregateMessageOrigin, Weight, ProcessMessageError} from './types'

/**
 * Remove a page which has no more messages remaining to be processed or is stale.
 */
export type MessageQueueReapPageCall = {
    messageOrigin: AggregateMessageOrigin,
    pageIndex: number,
}

export const MessageQueueReapPageCall: sts.Type<MessageQueueReapPageCall> = sts.struct(() => {
    return  {
        messageOrigin: AggregateMessageOrigin,
        pageIndex: sts.number(),
    }
})

/**
 * Execute an overweight message.
 * 
 * Temporary processing errors will be propagated whereas permanent errors are treated
 * as success condition.
 * 
 * - `origin`: Must be `Signed`.
 * - `message_origin`: The origin from which the message to be executed arrived.
 * - `page`: The page in the queue in which the message to be executed is sitting.
 * - `index`: The index into the queue of the message to be executed.
 * - `weight_limit`: The maximum amount of weight allowed to be consumed in the execution
 *   of the message.
 * 
 * Benchmark complexity considerations: O(index + weight_limit).
 */
export type MessageQueueExecuteOverweightCall = {
    messageOrigin: AggregateMessageOrigin,
    page: number,
    index: number,
    weightLimit: Weight,
}

export const MessageQueueExecuteOverweightCall: sts.Type<MessageQueueExecuteOverweightCall> = sts.struct(() => {
    return  {
        messageOrigin: AggregateMessageOrigin,
        page: sts.number(),
        index: sts.number(),
        weightLimit: Weight,
    }
})

/**
 * Message discarded due to an error in the `MessageProcessor` (usually a format error).
 */
export type MessageQueueProcessingFailedEvent = {
    id: Bytes,
    origin: AggregateMessageOrigin,
    error: ProcessMessageError,
}

export const MessageQueueProcessingFailedEvent: sts.Type<MessageQueueProcessingFailedEvent> = sts.struct(() => {
    return  {
        id: sts.bytes(),
        origin: AggregateMessageOrigin,
        error: ProcessMessageError,
    }
})

/**
 * Message is processed.
 */
export type MessageQueueProcessedEvent = {
    id: Bytes,
    origin: AggregateMessageOrigin,
    weightUsed: Weight,
    success: boolean,
}

export const MessageQueueProcessedEvent: sts.Type<MessageQueueProcessedEvent> = sts.struct(() => {
    return  {
        id: sts.bytes(),
        origin: AggregateMessageOrigin,
        weightUsed: Weight,
        success: sts.boolean(),
    }
})

/**
 * This page was reaped.
 */
export type MessageQueuePageReapedEvent = {
    origin: AggregateMessageOrigin,
    index: number,
}

export const MessageQueuePageReapedEvent: sts.Type<MessageQueuePageReapedEvent> = sts.struct(() => {
    return  {
        origin: AggregateMessageOrigin,
        index: sts.number(),
    }
})

/**
 * Message placed in overweight queue.
 */
export type MessageQueueOverweightEnqueuedEvent = {
    id: Bytes,
    origin: AggregateMessageOrigin,
    pageIndex: number,
    messageIndex: number,
}

export const MessageQueueOverweightEnqueuedEvent: sts.Type<MessageQueueOverweightEnqueuedEvent> = sts.struct(() => {
    return  {
        id: sts.bytes(),
        origin: AggregateMessageOrigin,
        pageIndex: sts.number(),
        messageIndex: sts.number(),
    }
})
