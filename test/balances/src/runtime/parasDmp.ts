import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9010 from './types/v9010'

export const storage = {
    DownwardMessageQueueHeads: createStorage(
        'ParasDmp.DownwardMessageQueueHeads',
        {
            v9010: v9010.ParasDmpDownwardMessageQueueHeadsStorage,
        }
    ),
    DownwardMessageQueues: createStorage(
        'ParasDmp.DownwardMessageQueues',
        {
            v9010: v9010.ParasDmpDownwardMessageQueuesStorage,
        }
    ),
}

export default {}
