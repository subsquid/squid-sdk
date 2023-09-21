import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9160 from './types/v9160'
import * as v9130 from './types/v9130'
import * as v9111 from './types/v9111'

export const events = {
    Rebagged: createEvent(
        'BagsList.Rebagged',
        {
            v9111: v9111.BagsListRebaggedEvent,
            v9130: v9130.BagsListRebaggedEvent,
        }
    ),
}

export const calls = {
    put_in_front_of: createCall(
        'BagsList.put_in_front_of',
        {
            v9160: v9160.BagsListPutInFrontOfCall,
        }
    ),
    rebag: createCall(
        'BagsList.rebag',
        {
            v9111: v9111.BagsListRebagCall,
        }
    ),
}

export const constants = {
    BagThresholds: createConstant(
        'BagsList.BagThresholds',
        {
            v9111: v9111.BagsListBagThresholdsConstant,
        }
    ),
}

export const storage = {
    CounterForListNodes: createStorage(
        'BagsList.CounterForListNodes',
        {
            v9111: v9111.BagsListCounterForListNodesStorage,
        }
    ),
    ListBags: createStorage(
        'BagsList.ListBags',
        {
            v9111: v9111.BagsListListBagsStorage,
        }
    ),
    ListNodes: createStorage(
        'BagsList.ListNodes',
        {
            v9111: v9111.BagsListListNodesStorage,
        }
    ),
}

export default {events, calls, constants}
