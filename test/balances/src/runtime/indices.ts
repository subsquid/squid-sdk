import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9291 from './types/v9291'
import * as v9130 from './types/v9130'
import * as v2023 from './types/v2023'
import * as v2007 from './types/v2007'
import * as v1050 from './types/v1050'
import * as v1020 from './types/v1020'

export const events = {
    IndexAssigned: createEvent(
        'Indices.IndexAssigned',
        {
            v1050: v1050.IndicesIndexAssignedEvent,
            v9130: v9130.IndicesIndexAssignedEvent,
        }
    ),
    IndexFreed: createEvent(
        'Indices.IndexFreed',
        {
            v1050: v1050.IndicesIndexFreedEvent,
            v9130: v9130.IndicesIndexFreedEvent,
        }
    ),
    IndexFrozen: createEvent(
        'Indices.IndexFrozen',
        {
            v2007: v2007.IndicesIndexFrozenEvent,
            v9130: v9130.IndicesIndexFrozenEvent,
        }
    ),
    NewAccountIndex: createEvent(
        'Indices.NewAccountIndex',
        {
            v1020: v1020.IndicesNewAccountIndexEvent,
        }
    ),
}

export const calls = {
    claim: createCall(
        'Indices.claim',
        {
            v1050: v1050.IndicesClaimCall,
        }
    ),
    force_transfer: createCall(
        'Indices.force_transfer',
        {
            v1050: v1050.IndicesForceTransferCall,
            v2007: v2007.IndicesForceTransferCall,
            v9291: v9291.IndicesForceTransferCall,
        }
    ),
    free: createCall(
        'Indices.free',
        {
            v1050: v1050.IndicesFreeCall,
        }
    ),
    freeze: createCall(
        'Indices.freeze',
        {
            v2007: v2007.IndicesFreezeCall,
        }
    ),
    transfer: createCall(
        'Indices.transfer',
        {
            v1050: v1050.IndicesTransferCall,
            v9291: v9291.IndicesTransferCall,
        }
    ),
}

export const constants = {
    Deposit: createConstant(
        'Indices.Deposit',
        {
            v2023: v2023.IndicesDepositConstant,
        }
    ),
}

export const storage = {
    Accounts: createStorage(
        'Indices.Accounts',
        {
            v1050: v1050.IndicesAccountsStorage,
            v2007: v2007.IndicesAccountsStorage,
        }
    ),
    EnumSet: createStorage(
        'Indices.EnumSet',
        {
            v1020: v1020.IndicesEnumSetStorage,
        }
    ),
    NextEnumSet: createStorage(
        'Indices.NextEnumSet',
        {
            v1020: v1020.IndicesNextEnumSetStorage,
        }
    ),
}

export default {events, calls, constants}
