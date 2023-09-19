import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Added: createEvent(
        'ChildBounties.Added',
        {
            v9190: ChildBountiesAddedEvent,
        }
    ),
    Awarded: createEvent(
        'ChildBounties.Awarded',
        {
            v9190: ChildBountiesAwardedEvent,
        }
    ),
    Canceled: createEvent(
        'ChildBounties.Canceled',
        {
            v9190: ChildBountiesCanceledEvent,
        }
    ),
    Claimed: createEvent(
        'ChildBounties.Claimed',
        {
            v9190: ChildBountiesClaimedEvent,
        }
    ),
}

export const calls = {
    accept_curator: createCall(
        'ChildBounties.accept_curator',
        {
            v9190: ChildBountiesAcceptCuratorCall,
        }
    ),
    add_child_bounty: createCall(
        'ChildBounties.add_child_bounty',
        {
            v9190: ChildBountiesAddChildBountyCall,
        }
    ),
    award_child_bounty: createCall(
        'ChildBounties.award_child_bounty',
        {
            v9190: ChildBountiesAwardChildBountyCall,
        }
    ),
    claim_child_bounty: createCall(
        'ChildBounties.claim_child_bounty',
        {
            v9190: ChildBountiesClaimChildBountyCall,
        }
    ),
    close_child_bounty: createCall(
        'ChildBounties.close_child_bounty',
        {
            v9190: ChildBountiesCloseChildBountyCall,
        }
    ),
    propose_curator: createCall(
        'ChildBounties.propose_curator',
        {
            v9190: ChildBountiesProposeCuratorCall,
        }
    ),
    unassign_curator: createCall(
        'ChildBounties.unassign_curator',
        {
            v9190: ChildBountiesUnassignCuratorCall,
        }
    ),
}

export const constants = {
    ChildBountyValueMinimum: createConstant(
        'ChildBounties.ChildBountyValueMinimum',
        {
            v9190: ChildBountiesChildBountyValueMinimumConstant,
        }
    ),
    MaxActiveChildBountyCount: createConstant(
        'ChildBounties.MaxActiveChildBountyCount',
        {
            v9190: ChildBountiesMaxActiveChildBountyCountConstant,
        }
    ),
}

export const storage = {
    ChildBounties: createStorage(
        'ChildBounties.ChildBounties',
        {
            v9190: ChildBountiesChildBountiesStorage,
        }
    ),
    ChildBountyCount: createStorage(
        'ChildBounties.ChildBountyCount',
        {
            v9190: ChildBountiesChildBountyCountStorage,
        }
    ),
    ChildBountyDescriptions: createStorage(
        'ChildBounties.ChildBountyDescriptions',
        {
            v9190: ChildBountiesChildBountyDescriptionsStorage,
        }
    ),
    ChildrenCuratorFees: createStorage(
        'ChildBounties.ChildrenCuratorFees',
        {
            v9190: ChildBountiesChildrenCuratorFeesStorage,
        }
    ),
    ParentChildBounties: createStorage(
        'ChildBounties.ParentChildBounties',
        {
            v9190: ChildBountiesParentChildBountiesStorage,
        }
    ),
}

export default {events, calls, constants}
