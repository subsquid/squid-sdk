import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Awarded: createEvent(
        'Treasury.Awarded',
        {
            v1020: TreasuryAwardedEvent,
            v9160: TreasuryAwardedEvent,
        }
    ),
    BountyAwarded: createEvent(
        'Treasury.BountyAwarded',
        {
            v2025: TreasuryBountyAwardedEvent,
        }
    ),
    BountyBecameActive: createEvent(
        'Treasury.BountyBecameActive',
        {
            v2025: TreasuryBountyBecameActiveEvent,
        }
    ),
    BountyCanceled: createEvent(
        'Treasury.BountyCanceled',
        {
            v2025: TreasuryBountyCanceledEvent,
        }
    ),
    BountyClaimed: createEvent(
        'Treasury.BountyClaimed',
        {
            v2025: TreasuryBountyClaimedEvent,
        }
    ),
    BountyExtended: createEvent(
        'Treasury.BountyExtended',
        {
            v2025: TreasuryBountyExtendedEvent,
        }
    ),
    BountyProposed: createEvent(
        'Treasury.BountyProposed',
        {
            v2025: TreasuryBountyProposedEvent,
        }
    ),
    BountyRejected: createEvent(
        'Treasury.BountyRejected',
        {
            v2025: TreasuryBountyRejectedEvent,
        }
    ),
    Burnt: createEvent(
        'Treasury.Burnt',
        {
            v1020: TreasuryBurntEvent,
            v9160: TreasuryBurntEvent,
        }
    ),
    Deposit: createEvent(
        'Treasury.Deposit',
        {
            v1020: TreasuryDepositEvent,
            v9160: TreasuryDepositEvent,
        }
    ),
    NewTip: createEvent(
        'Treasury.NewTip',
        {
            v1038: TreasuryNewTipEvent,
        }
    ),
    Proposed: createEvent(
        'Treasury.Proposed',
        {
            v1020: TreasuryProposedEvent,
            v9160: TreasuryProposedEvent,
        }
    ),
    Rejected: createEvent(
        'Treasury.Rejected',
        {
            v1032: TreasuryRejectedEvent,
            v9160: TreasuryRejectedEvent,
        }
    ),
    Rollover: createEvent(
        'Treasury.Rollover',
        {
            v1020: TreasuryRolloverEvent,
            v9160: TreasuryRolloverEvent,
        }
    ),
    SpendApproved: createEvent(
        'Treasury.SpendApproved',
        {
            v9250: TreasurySpendApprovedEvent,
        }
    ),
    Spending: createEvent(
        'Treasury.Spending',
        {
            v1020: TreasurySpendingEvent,
            v9160: TreasurySpendingEvent,
        }
    ),
    TipClosed: createEvent(
        'Treasury.TipClosed',
        {
            v1038: TreasuryTipClosedEvent,
        }
    ),
    TipClosing: createEvent(
        'Treasury.TipClosing',
        {
            v1038: TreasuryTipClosingEvent,
        }
    ),
    TipRetracted: createEvent(
        'Treasury.TipRetracted',
        {
            v1038: TreasuryTipRetractedEvent,
        }
    ),
    UpdatedInactive: createEvent(
        'Treasury.UpdatedInactive',
        {
            v9370: TreasuryUpdatedInactiveEvent,
        }
    ),
}

export const calls = {
    accept_curator: createCall(
        'Treasury.accept_curator',
        {
            v2025: TreasuryAcceptCuratorCall,
        }
    ),
    approve_bounty: createCall(
        'Treasury.approve_bounty',
        {
            v2025: TreasuryApproveBountyCall,
        }
    ),
    approve_proposal: createCall(
        'Treasury.approve_proposal',
        {
            v1020: TreasuryApproveProposalCall,
            v9111: TreasuryApproveProposalCall,
        }
    ),
    award_bounty: createCall(
        'Treasury.award_bounty',
        {
            v2025: TreasuryAwardBountyCall,
        }
    ),
    claim_bounty: createCall(
        'Treasury.claim_bounty',
        {
            v2025: TreasuryClaimBountyCall,
        }
    ),
    close_bounty: createCall(
        'Treasury.close_bounty',
        {
            v2025: TreasuryCloseBountyCall,
        }
    ),
    close_tip: createCall(
        'Treasury.close_tip',
        {
            v1038: TreasuryCloseTipCall,
        }
    ),
    extend_bounty_expiry: createCall(
        'Treasury.extend_bounty_expiry',
        {
            v2025: TreasuryExtendBountyExpiryCall,
        }
    ),
    propose_bounty: createCall(
        'Treasury.propose_bounty',
        {
            v2025: TreasuryProposeBountyCall,
        }
    ),
    propose_curator: createCall(
        'Treasury.propose_curator',
        {
            v2025: TreasuryProposeCuratorCall,
        }
    ),
    propose_spend: createCall(
        'Treasury.propose_spend',
        {
            v1020: TreasuryProposeSpendCall,
            v1050: TreasuryProposeSpendCall,
            v2028: TreasuryProposeSpendCall,
            v9111: TreasuryProposeSpendCall,
        }
    ),
    reject_proposal: createCall(
        'Treasury.reject_proposal',
        {
            v1020: TreasuryRejectProposalCall,
            v9111: TreasuryRejectProposalCall,
        }
    ),
    remove_approval: createCall(
        'Treasury.remove_approval',
        {
            v9220: TreasuryRemoveApprovalCall,
        }
    ),
    report_awesome: createCall(
        'Treasury.report_awesome',
        {
            v1038: TreasuryReportAwesomeCall,
        }
    ),
    retract_tip: createCall(
        'Treasury.retract_tip',
        {
            v1038: TreasuryRetractTipCall,
        }
    ),
    spend: createCall(
        'Treasury.spend',
        {
            v9250: TreasurySpendCall,
        }
    ),
    tip: createCall(
        'Treasury.tip',
        {
            v1038: TreasuryTipCall,
        }
    ),
    tip_new: createCall(
        'Treasury.tip_new',
        {
            v1038: TreasuryTipNewCall,
        }
    ),
    unassign_curator: createCall(
        'Treasury.unassign_curator',
        {
            v2025: TreasuryUnassignCuratorCall,
        }
    ),
}

export const constants = {
    BountyCuratorDeposit: createConstant(
        'Treasury.BountyCuratorDeposit',
        {
            v2025: TreasuryBountyCuratorDepositConstant,
        }
    ),
    BountyDepositBase: createConstant(
        'Treasury.BountyDepositBase',
        {
            v2025: TreasuryBountyDepositBaseConstant,
        }
    ),
    BountyDepositPayoutDelay: createConstant(
        'Treasury.BountyDepositPayoutDelay',
        {
            v2025: TreasuryBountyDepositPayoutDelayConstant,
        }
    ),
    BountyValueMinimum: createConstant(
        'Treasury.BountyValueMinimum',
        {
            v2025: TreasuryBountyValueMinimumConstant,
        }
    ),
    Burn: createConstant(
        'Treasury.Burn',
        {
            v1020: TreasuryBurnConstant,
        }
    ),
    DataDepositPerByte: createConstant(
        'Treasury.DataDepositPerByte',
        {
            v2025: TreasuryDataDepositPerByteConstant,
        }
    ),
    MaxApprovals: createConstant(
        'Treasury.MaxApprovals',
        {
            v9090: TreasuryMaxApprovalsConstant,
        }
    ),
    MaximumReasonLength: createConstant(
        'Treasury.MaximumReasonLength',
        {
            v2025: TreasuryMaximumReasonLengthConstant,
        }
    ),
    ModuleId: createConstant(
        'Treasury.ModuleId',
        {
            v1062: TreasuryModuleIdConstant,
        }
    ),
    PalletId: createConstant(
        'Treasury.PalletId',
        {
            v9010: TreasuryPalletIdConstant,
        }
    ),
    ProposalBond: createConstant(
        'Treasury.ProposalBond',
        {
            v1020: TreasuryProposalBondConstant,
        }
    ),
    ProposalBondMaximum: createConstant(
        'Treasury.ProposalBondMaximum',
        {
            v9160: TreasuryProposalBondMaximumConstant,
        }
    ),
    ProposalBondMinimum: createConstant(
        'Treasury.ProposalBondMinimum',
        {
            v1020: TreasuryProposalBondMinimumConstant,
        }
    ),
    SpendPeriod: createConstant(
        'Treasury.SpendPeriod',
        {
            v1020: TreasurySpendPeriodConstant,
        }
    ),
    TipCountdown: createConstant(
        'Treasury.TipCountdown',
        {
            v1038: TreasuryTipCountdownConstant,
        }
    ),
    TipFindersFee: createConstant(
        'Treasury.TipFindersFee',
        {
            v1038: TreasuryTipFindersFeeConstant,
        }
    ),
    TipReportDepositBase: createConstant(
        'Treasury.TipReportDepositBase',
        {
            v1038: TreasuryTipReportDepositBaseConstant,
        }
    ),
    TipReportDepositPerByte: createConstant(
        'Treasury.TipReportDepositPerByte',
        {
            v1038: TreasuryTipReportDepositPerByteConstant,
        }
    ),
}

export const storage = {
    Approvals: createStorage(
        'Treasury.Approvals',
        {
            v1020: TreasuryApprovalsStorage,
        }
    ),
    Bounties: createStorage(
        'Treasury.Bounties',
        {
            v2025: TreasuryBountiesStorage,
        }
    ),
    BountyApprovals: createStorage(
        'Treasury.BountyApprovals',
        {
            v2025: TreasuryBountyApprovalsStorage,
        }
    ),
    BountyCount: createStorage(
        'Treasury.BountyCount',
        {
            v2025: TreasuryBountyCountStorage,
        }
    ),
    BountyDescriptions: createStorage(
        'Treasury.BountyDescriptions',
        {
            v2025: TreasuryBountyDescriptionsStorage,
        }
    ),
    Deactivated: createStorage(
        'Treasury.Deactivated',
        {
            v9370: TreasuryDeactivatedStorage,
        }
    ),
    Inactive: createStorage(
        'Treasury.Inactive',
        {
            v9340: TreasuryInactiveStorage,
        }
    ),
    ProposalCount: createStorage(
        'Treasury.ProposalCount',
        {
            v1020: TreasuryProposalCountStorage,
        }
    ),
    Proposals: createStorage(
        'Treasury.Proposals',
        {
            v1020: TreasuryProposalsStorage,
        }
    ),
    Reasons: createStorage(
        'Treasury.Reasons',
        {
            v1038: TreasuryReasonsStorage,
        }
    ),
    Tips: createStorage(
        'Treasury.Tips',
        {
            v1038: TreasuryTipsStorage,
            v2013: TreasuryTipsStorage,
        }
    ),
}

export default {events, calls, constants}
