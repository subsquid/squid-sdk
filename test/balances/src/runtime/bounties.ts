import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9190 from './types/v9190'
import * as v9130 from './types/v9130'
import * as v9111 from './types/v9111'
import * as v2028 from './types/v2028'

export const events = {
    BountyAwarded: createEvent(
        'Bounties.BountyAwarded',
        {
            v2028: v2028.BountiesBountyAwardedEvent,
            v9130: v9130.BountiesBountyAwardedEvent,
        }
    ),
    BountyBecameActive: createEvent(
        'Bounties.BountyBecameActive',
        {
            v2028: v2028.BountiesBountyBecameActiveEvent,
            v9130: v9130.BountiesBountyBecameActiveEvent,
        }
    ),
    BountyCanceled: createEvent(
        'Bounties.BountyCanceled',
        {
            v2028: v2028.BountiesBountyCanceledEvent,
            v9130: v9130.BountiesBountyCanceledEvent,
        }
    ),
    BountyClaimed: createEvent(
        'Bounties.BountyClaimed',
        {
            v2028: v2028.BountiesBountyClaimedEvent,
            v9130: v9130.BountiesBountyClaimedEvent,
        }
    ),
    BountyExtended: createEvent(
        'Bounties.BountyExtended',
        {
            v2028: v2028.BountiesBountyExtendedEvent,
            v9130: v9130.BountiesBountyExtendedEvent,
        }
    ),
    BountyProposed: createEvent(
        'Bounties.BountyProposed',
        {
            v2028: v2028.BountiesBountyProposedEvent,
            v9130: v9130.BountiesBountyProposedEvent,
        }
    ),
    BountyRejected: createEvent(
        'Bounties.BountyRejected',
        {
            v2028: v2028.BountiesBountyRejectedEvent,
            v9130: v9130.BountiesBountyRejectedEvent,
        }
    ),
}

export const calls = {
    accept_curator: createCall(
        'Bounties.accept_curator',
        {
            v2028: v2028.BountiesAcceptCuratorCall,
            v9111: v9111.BountiesAcceptCuratorCall,
        }
    ),
    approve_bounty: createCall(
        'Bounties.approve_bounty',
        {
            v2028: v2028.BountiesApproveBountyCall,
            v9111: v9111.BountiesApproveBountyCall,
        }
    ),
    award_bounty: createCall(
        'Bounties.award_bounty',
        {
            v2028: v2028.BountiesAwardBountyCall,
            v9111: v9111.BountiesAwardBountyCall,
        }
    ),
    claim_bounty: createCall(
        'Bounties.claim_bounty',
        {
            v2028: v2028.BountiesClaimBountyCall,
            v9111: v9111.BountiesClaimBountyCall,
        }
    ),
    close_bounty: createCall(
        'Bounties.close_bounty',
        {
            v2028: v2028.BountiesCloseBountyCall,
            v9111: v9111.BountiesCloseBountyCall,
        }
    ),
    extend_bounty_expiry: createCall(
        'Bounties.extend_bounty_expiry',
        {
            v2028: v2028.BountiesExtendBountyExpiryCall,
            v9111: v9111.BountiesExtendBountyExpiryCall,
        }
    ),
    propose_bounty: createCall(
        'Bounties.propose_bounty',
        {
            v2028: v2028.BountiesProposeBountyCall,
        }
    ),
    propose_curator: createCall(
        'Bounties.propose_curator',
        {
            v2028: v2028.BountiesProposeCuratorCall,
            v9111: v9111.BountiesProposeCuratorCall,
        }
    ),
    unassign_curator: createCall(
        'Bounties.unassign_curator',
        {
            v2028: v2028.BountiesUnassignCuratorCall,
            v9111: v9111.BountiesUnassignCuratorCall,
        }
    ),
}

export const constants = {
    BountyCuratorDeposit: createConstant(
        'Bounties.BountyCuratorDeposit',
        {
            v2028: v2028.BountiesBountyCuratorDepositConstant,
        }
    ),
    BountyDepositBase: createConstant(
        'Bounties.BountyDepositBase',
        {
            v2028: v2028.BountiesBountyDepositBaseConstant,
        }
    ),
    BountyDepositPayoutDelay: createConstant(
        'Bounties.BountyDepositPayoutDelay',
        {
            v2028: v2028.BountiesBountyDepositPayoutDelayConstant,
        }
    ),
    BountyUpdatePeriod: createConstant(
        'Bounties.BountyUpdatePeriod',
        {
            v2028: v2028.BountiesBountyUpdatePeriodConstant,
        }
    ),
    BountyValueMinimum: createConstant(
        'Bounties.BountyValueMinimum',
        {
            v2028: v2028.BountiesBountyValueMinimumConstant,
        }
    ),
    CuratorDepositMax: createConstant(
        'Bounties.CuratorDepositMax',
        {
            v9190: v9190.BountiesCuratorDepositMaxConstant,
        }
    ),
    CuratorDepositMin: createConstant(
        'Bounties.CuratorDepositMin',
        {
            v9190: v9190.BountiesCuratorDepositMinConstant,
        }
    ),
    CuratorDepositMultiplier: createConstant(
        'Bounties.CuratorDepositMultiplier',
        {
            v9190: v9190.BountiesCuratorDepositMultiplierConstant,
        }
    ),
    DataDepositPerByte: createConstant(
        'Bounties.DataDepositPerByte',
        {
            v2028: v2028.BountiesDataDepositPerByteConstant,
        }
    ),
    MaximumReasonLength: createConstant(
        'Bounties.MaximumReasonLength',
        {
            v2028: v2028.BountiesMaximumReasonLengthConstant,
        }
    ),
}

export const storage = {
    Bounties: createStorage(
        'Bounties.Bounties',
        {
            v2028: v2028.BountiesBountiesStorage,
            v9111: v9111.BountiesBountiesStorage,
        }
    ),
    BountyApprovals: createStorage(
        'Bounties.BountyApprovals',
        {
            v2028: v2028.BountiesBountyApprovalsStorage,
        }
    ),
    BountyCount: createStorage(
        'Bounties.BountyCount',
        {
            v2028: v2028.BountiesBountyCountStorage,
        }
    ),
    BountyDescriptions: createStorage(
        'Bounties.BountyDescriptions',
        {
            v2028: v2028.BountiesBountyDescriptionsStorage,
        }
    ),
}

export default {events, calls, constants}
