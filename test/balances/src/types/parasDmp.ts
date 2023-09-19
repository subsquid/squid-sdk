import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const storage = {
    DownwardMessageQueueHeads: createStorage(
        'ParasDmp.DownwardMessageQueueHeads',
        {
            v9010: ParasDmpDownwardMessageQueueHeadsStorage,
        }
    ),
    DownwardMessageQueues: createStorage(
        'ParasDmp.DownwardMessageQueues',
        {
            v9010: ParasDmpDownwardMessageQueuesStorage,
        }
    ),
}

export default {}
