import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const calls = {
    set: createCall(
        'Timestamp.set',
        {
            v1020: TimestampSetCall,
        }
    ),
}

export const constants = {
    MinimumPeriod: createConstant(
        'Timestamp.MinimumPeriod',
        {
            v1020: TimestampMinimumPeriodConstant,
        }
    ),
}

export const storage = {
    DidUpdate: createStorage(
        'Timestamp.DidUpdate',
        {
            v1020: TimestampDidUpdateStorage,
        }
    ),
    Now: createStorage(
        'Timestamp.Now',
        {
            v1020: TimestampNowStorage,
        }
    ),
}

export default {calls, constants}
