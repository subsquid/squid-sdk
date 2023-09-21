import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9291 from './types/v9291'
import * as v9230 from './types/v9230'

export const events = {
    Rebagged: createEvent(
        'VoterList.Rebagged',
        {
            v9230: v9230.VoterListRebaggedEvent,
        }
    ),
    ScoreUpdated: createEvent(
        'VoterList.ScoreUpdated',
        {
            v9230: v9230.VoterListScoreUpdatedEvent,
        }
    ),
}

export const calls = {
    put_in_front_of: createCall(
        'VoterList.put_in_front_of',
        {
            v9230: v9230.VoterListPutInFrontOfCall,
            v9291: v9291.VoterListPutInFrontOfCall,
        }
    ),
    rebag: createCall(
        'VoterList.rebag',
        {
            v9230: v9230.VoterListRebagCall,
            v9291: v9291.VoterListRebagCall,
        }
    ),
}

export const constants = {
    BagThresholds: createConstant(
        'VoterList.BagThresholds',
        {
            v9230: v9230.VoterListBagThresholdsConstant,
        }
    ),
}

export const storage = {
    CounterForListNodes: createStorage(
        'VoterList.CounterForListNodes',
        {
            v9230: v9230.VoterListCounterForListNodesStorage,
        }
    ),
    ListBags: createStorage(
        'VoterList.ListBags',
        {
            v9230: v9230.VoterListListBagsStorage,
        }
    ),
    ListNodes: createStorage(
        'VoterList.ListNodes',
        {
            v9230: v9230.VoterListListNodesStorage,
        }
    ),
}

export default {events, calls, constants}
