import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9291 from './types/v9291'
import * as v9111 from './types/v9111'
import * as v1050 from './types/v1050'
import * as v1029 from './types/v1029'
import * as v1020 from './types/v1020'

export const events = {
    Dummy: createEvent(
        'TechnicalMembership.Dummy',
        {
            v1020: v1020.TechnicalMembershipDummyEvent,
            v9111: v9111.TechnicalMembershipDummyEvent,
        }
    ),
    KeyChanged: createEvent(
        'TechnicalMembership.KeyChanged',
        {
            v1029: v1029.TechnicalMembershipKeyChangedEvent,
        }
    ),
    MemberAdded: createEvent(
        'TechnicalMembership.MemberAdded',
        {
            v1020: v1020.TechnicalMembershipMemberAddedEvent,
        }
    ),
    MemberRemoved: createEvent(
        'TechnicalMembership.MemberRemoved',
        {
            v1020: v1020.TechnicalMembershipMemberRemovedEvent,
        }
    ),
    MembersReset: createEvent(
        'TechnicalMembership.MembersReset',
        {
            v1020: v1020.TechnicalMembershipMembersResetEvent,
        }
    ),
    MembersSwapped: createEvent(
        'TechnicalMembership.MembersSwapped',
        {
            v1020: v1020.TechnicalMembershipMembersSwappedEvent,
        }
    ),
}

export const calls = {
    add_member: createCall(
        'TechnicalMembership.add_member',
        {
            v1020: v1020.TechnicalMembershipAddMemberCall,
            v9291: v9291.TechnicalMembershipAddMemberCall,
        }
    ),
    change_key: createCall(
        'TechnicalMembership.change_key',
        {
            v1029: v1029.TechnicalMembershipChangeKeyCall,
            v9291: v9291.TechnicalMembershipChangeKeyCall,
        }
    ),
    clear_prime: createCall(
        'TechnicalMembership.clear_prime',
        {
            v1050: v1050.TechnicalMembershipClearPrimeCall,
        }
    ),
    remove_member: createCall(
        'TechnicalMembership.remove_member',
        {
            v1020: v1020.TechnicalMembershipRemoveMemberCall,
            v9291: v9291.TechnicalMembershipRemoveMemberCall,
        }
    ),
    reset_members: createCall(
        'TechnicalMembership.reset_members',
        {
            v1020: v1020.TechnicalMembershipResetMembersCall,
        }
    ),
    set_prime: createCall(
        'TechnicalMembership.set_prime',
        {
            v1050: v1050.TechnicalMembershipSetPrimeCall,
            v9291: v9291.TechnicalMembershipSetPrimeCall,
        }
    ),
    swap_member: createCall(
        'TechnicalMembership.swap_member',
        {
            v1020: v1020.TechnicalMembershipSwapMemberCall,
            v9291: v9291.TechnicalMembershipSwapMemberCall,
        }
    ),
}

export const storage = {
    Members: createStorage(
        'TechnicalMembership.Members',
        {
            v1020: v1020.TechnicalMembershipMembersStorage,
        }
    ),
    Prime: createStorage(
        'TechnicalMembership.Prime',
        {
            v1050: v1050.TechnicalMembershipPrimeStorage,
        }
    ),
}

export default {events, calls}
