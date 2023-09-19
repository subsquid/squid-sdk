import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const storage = {
    DeliveryFeeFactor: createStorage(
        'Dmp.DeliveryFeeFactor',
        {
            v9420: DmpDeliveryFeeFactorStorage,
        }
    ),
    DownwardMessageQueueHeads: createStorage(
        'Dmp.DownwardMessageQueueHeads',
        {
            v9090: DmpDownwardMessageQueueHeadsStorage,
        }
    ),
    DownwardMessageQueues: createStorage(
        'Dmp.DownwardMessageQueues',
        {
            v9090: DmpDownwardMessageQueuesStorage,
            v9111: DmpDownwardMessageQueuesStorage,
        }
    ),
}

export default {}
