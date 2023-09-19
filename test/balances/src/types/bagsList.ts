import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Rebagged: createEvent(
        'BagsList.Rebagged',
        {
            v9111: BagsListRebaggedEvent,
            v9130: BagsListRebaggedEvent,
        }
    ),
}

export const calls = {
    put_in_front_of: createCall(
        'BagsList.put_in_front_of',
        {
            v9160: BagsListPutInFrontOfCall,
        }
    ),
    rebag: createCall(
        'BagsList.rebag',
        {
            v9111: BagsListRebagCall,
        }
    ),
}

export const constants = {
    BagThresholds: createConstant(
        'BagsList.BagThresholds',
        {
            v9111: BagsListBagThresholdsConstant,
        }
    ),
}

export const storage = {
    CounterForListNodes: createStorage(
        'BagsList.CounterForListNodes',
        {
            v9111: BagsListCounterForListNodesStorage,
        }
    ),
    ListBags: createStorage(
        'BagsList.ListBags',
        {
            v9111: BagsListListBagsStorage,
        }
    ),
    ListNodes: createStorage(
        'BagsList.ListNodes',
        {
            v9111: BagsListListNodesStorage,
        }
    ),
}

export default {events, calls, constants}
