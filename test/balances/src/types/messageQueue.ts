import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    OverweightEnqueued: createEvent(
        'MessageQueue.OverweightEnqueued',
        {
            v9430: MessageQueueOverweightEnqueuedEvent,
        }
    ),
    PageReaped: createEvent(
        'MessageQueue.PageReaped',
        {
            v9430: MessageQueuePageReapedEvent,
        }
    ),
    Processed: createEvent(
        'MessageQueue.Processed',
        {
            v9430: MessageQueueProcessedEvent,
        }
    ),
    ProcessingFailed: createEvent(
        'MessageQueue.ProcessingFailed',
        {
            v9430: MessageQueueProcessingFailedEvent,
        }
    ),
}

export const calls = {
    execute_overweight: createCall(
        'MessageQueue.execute_overweight',
        {
            v9430: MessageQueueExecuteOverweightCall,
        }
    ),
    reap_page: createCall(
        'MessageQueue.reap_page',
        {
            v9430: MessageQueueReapPageCall,
        }
    ),
}

export const constants = {
    HeapSize: createConstant(
        'MessageQueue.HeapSize',
        {
            v9430: MessageQueueHeapSizeConstant,
        }
    ),
    MaxStale: createConstant(
        'MessageQueue.MaxStale',
        {
            v9430: MessageQueueMaxStaleConstant,
        }
    ),
    ServiceWeight: createConstant(
        'MessageQueue.ServiceWeight',
        {
            v9430: MessageQueueServiceWeightConstant,
        }
    ),
}

export const storage = {
    BookStateFor: createStorage(
        'MessageQueue.BookStateFor',
        {
            v9430: MessageQueueBookStateForStorage,
        }
    ),
    Pages: createStorage(
        'MessageQueue.Pages',
        {
            v9430: MessageQueuePagesStorage,
        }
    ),
    ServiceHead: createStorage(
        'MessageQueue.ServiceHead',
        {
            v9430: MessageQueueServiceHeadStorage,
        }
    ),
}

export default {events, calls, constants}
