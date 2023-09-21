import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9420 from './types/v9420'
import * as v9111 from './types/v9111'
import * as v9090 from './types/v9090'

export const storage = {
    DeliveryFeeFactor: createStorage(
        'Dmp.DeliveryFeeFactor',
        {
            v9420: v9420.DmpDeliveryFeeFactorStorage,
        }
    ),
    DownwardMessageQueueHeads: createStorage(
        'Dmp.DownwardMessageQueueHeads',
        {
            v9090: v9090.DmpDownwardMessageQueueHeadsStorage,
        }
    ),
    DownwardMessageQueues: createStorage(
        'Dmp.DownwardMessageQueues',
        {
            v9090: v9090.DmpDownwardMessageQueuesStorage,
            v9111: v9111.DmpDownwardMessageQueuesStorage,
        }
    ),
}

export default {}
