import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9320 from './types/v9320'
import * as v9291 from './types/v9291'
import * as v9250 from './types/v9250'
import * as v9190 from './types/v9190'
import * as v9170 from './types/v9170'
import * as v9160 from './types/v9160'
import * as v9130 from './types/v9130'
import * as v9111 from './types/v9111'
import * as v9090 from './types/v9090'
import * as v2025 from './types/v2025'
import * as v2005 from './types/v2005'
import * as v1058 from './types/v1058'
import * as v1055 from './types/v1055'
import * as v1050 from './types/v1050'
import * as v1030 from './types/v1030'
import * as v1022 from './types/v1022'
import * as v1020 from './types/v1020'

export const events = {
    Blacklisted: createEvent(
        'Democracy.Blacklisted',
        {
            v2025: v2025.DemocracyBlacklistedEvent,
            v9130: v9130.DemocracyBlacklistedEvent,
        }
    ),
    Cancelled: createEvent(
        'Democracy.Cancelled',
        {
            v1020: v1020.DemocracyCancelledEvent,
            v9130: v9130.DemocracyCancelledEvent,
        }
    ),
    Delegated: createEvent(
        'Democracy.Delegated',
        {
            v1020: v1020.DemocracyDelegatedEvent,
            v9130: v9130.DemocracyDelegatedEvent,
        }
    ),
    Executed: createEvent(
        'Democracy.Executed',
        {
            v1020: v1020.DemocracyExecutedEvent,
            v9090: v9090.DemocracyExecutedEvent,
            v9111: v9111.DemocracyExecutedEvent,
            v9130: v9130.DemocracyExecutedEvent,
            v9160: v9160.DemocracyExecutedEvent,
            v9170: v9170.DemocracyExecutedEvent,
            v9190: v9190.DemocracyExecutedEvent,
        }
    ),
    ExternalTabled: createEvent(
        'Democracy.ExternalTabled',
        {
            v1020: v1020.DemocracyExternalTabledEvent,
        }
    ),
    NotPassed: createEvent(
        'Democracy.NotPassed',
        {
            v1020: v1020.DemocracyNotPassedEvent,
            v9130: v9130.DemocracyNotPassedEvent,
        }
    ),
    Passed: createEvent(
        'Democracy.Passed',
        {
            v1020: v1020.DemocracyPassedEvent,
            v9130: v9130.DemocracyPassedEvent,
        }
    ),
    PreimageInvalid: createEvent(
        'Democracy.PreimageInvalid',
        {
            v1022: v1022.DemocracyPreimageInvalidEvent,
            v9130: v9130.DemocracyPreimageInvalidEvent,
        }
    ),
    PreimageMissing: createEvent(
        'Democracy.PreimageMissing',
        {
            v1022: v1022.DemocracyPreimageMissingEvent,
            v9130: v9130.DemocracyPreimageMissingEvent,
        }
    ),
    PreimageNoted: createEvent(
        'Democracy.PreimageNoted',
        {
            v1022: v1022.DemocracyPreimageNotedEvent,
            v9130: v9130.DemocracyPreimageNotedEvent,
        }
    ),
    PreimageReaped: createEvent(
        'Democracy.PreimageReaped',
        {
            v1022: v1022.DemocracyPreimageReapedEvent,
            v9130: v9130.DemocracyPreimageReapedEvent,
        }
    ),
    PreimageUsed: createEvent(
        'Democracy.PreimageUsed',
        {
            v1022: v1022.DemocracyPreimageUsedEvent,
            v9130: v9130.DemocracyPreimageUsedEvent,
        }
    ),
    ProposalCanceled: createEvent(
        'Democracy.ProposalCanceled',
        {
            v9250: v9250.DemocracyProposalCanceledEvent,
        }
    ),
    Proposed: createEvent(
        'Democracy.Proposed',
        {
            v1020: v1020.DemocracyProposedEvent,
            v9130: v9130.DemocracyProposedEvent,
        }
    ),
    Seconded: createEvent(
        'Democracy.Seconded',
        {
            v9160: v9160.DemocracySecondedEvent,
        }
    ),
    Started: createEvent(
        'Democracy.Started',
        {
            v1020: v1020.DemocracyStartedEvent,
            v9130: v9130.DemocracyStartedEvent,
        }
    ),
    Tabled: createEvent(
        'Democracy.Tabled',
        {
            v1020: v1020.DemocracyTabledEvent,
            v9130: v9130.DemocracyTabledEvent,
            v9320: v9320.DemocracyTabledEvent,
        }
    ),
    Undelegated: createEvent(
        'Democracy.Undelegated',
        {
            v1020: v1020.DemocracyUndelegatedEvent,
            v9130: v9130.DemocracyUndelegatedEvent,
        }
    ),
    Unlocked: createEvent(
        'Democracy.Unlocked',
        {
            v1050: v1050.DemocracyUnlockedEvent,
        }
    ),
    Vetoed: createEvent(
        'Democracy.Vetoed',
        {
            v1020: v1020.DemocracyVetoedEvent,
            v9130: v9130.DemocracyVetoedEvent,
        }
    ),
    Voted: createEvent(
        'Democracy.Voted',
        {
            v9160: v9160.DemocracyVotedEvent,
        }
    ),
}

export const calls = {
    activate_proxy: createCall(
        'Democracy.activate_proxy',
        {
            v1050: v1050.DemocracyActivateProxyCall,
        }
    ),
    blacklist: createCall(
        'Democracy.blacklist',
        {
            v2025: v2025.DemocracyBlacklistCall,
            v9111: v9111.DemocracyBlacklistCall,
        }
    ),
    cancel_proposal: createCall(
        'Democracy.cancel_proposal',
        {
            v2025: v2025.DemocracyCancelProposalCall,
            v9111: v9111.DemocracyCancelProposalCall,
        }
    ),
    cancel_queued: createCall(
        'Democracy.cancel_queued',
        {
            v1020: v1020.DemocracyCancelQueuedCall,
            v1030: v1030.DemocracyCancelQueuedCall,
        }
    ),
    cancel_referendum: createCall(
        'Democracy.cancel_referendum',
        {
            v1020: v1020.DemocracyCancelReferendumCall,
            v9111: v9111.DemocracyCancelReferendumCall,
        }
    ),
    clear_public_proposals: createCall(
        'Democracy.clear_public_proposals',
        {
            v1022: v1022.DemocracyClearPublicProposalsCall,
        }
    ),
    close_proxy: createCall(
        'Democracy.close_proxy',
        {
            v1050: v1050.DemocracyCloseProxyCall,
        }
    ),
    deactivate_proxy: createCall(
        'Democracy.deactivate_proxy',
        {
            v1050: v1050.DemocracyDeactivateProxyCall,
        }
    ),
    delegate: createCall(
        'Democracy.delegate',
        {
            v1020: v1020.DemocracyDelegateCall,
            v1055: v1055.DemocracyDelegateCall,
            v9291: v9291.DemocracyDelegateCall,
        }
    ),
    emergency_cancel: createCall(
        'Democracy.emergency_cancel',
        {
            v1020: v1020.DemocracyEmergencyCancelCall,
            v9111: v9111.DemocracyEmergencyCancelCall,
        }
    ),
    enact_proposal: createCall(
        'Democracy.enact_proposal',
        {
            v1058: v1058.DemocracyEnactProposalCall,
            v9111: v9111.DemocracyEnactProposalCall,
        }
    ),
    external_propose: createCall(
        'Democracy.external_propose',
        {
            v1020: v1020.DemocracyExternalProposeCall,
            v1022: v1022.DemocracyExternalProposeCall,
            v9111: v9111.DemocracyExternalProposeCall,
            v9320: v9320.DemocracyExternalProposeCall,
        }
    ),
    external_propose_default: createCall(
        'Democracy.external_propose_default',
        {
            v1020: v1020.DemocracyExternalProposeDefaultCall,
            v1022: v1022.DemocracyExternalProposeDefaultCall,
            v9111: v9111.DemocracyExternalProposeDefaultCall,
            v9320: v9320.DemocracyExternalProposeDefaultCall,
        }
    ),
    external_propose_majority: createCall(
        'Democracy.external_propose_majority',
        {
            v1020: v1020.DemocracyExternalProposeMajorityCall,
            v1022: v1022.DemocracyExternalProposeMajorityCall,
            v9111: v9111.DemocracyExternalProposeMajorityCall,
            v9320: v9320.DemocracyExternalProposeMajorityCall,
        }
    ),
    fast_track: createCall(
        'Democracy.fast_track',
        {
            v1020: v1020.DemocracyFastTrackCall,
            v9111: v9111.DemocracyFastTrackCall,
        }
    ),
    note_imminent_preimage: createCall(
        'Democracy.note_imminent_preimage',
        {
            v1022: v1022.DemocracyNoteImminentPreimageCall,
            v1030: v1030.DemocracyNoteImminentPreimageCall,
            v9111: v9111.DemocracyNoteImminentPreimageCall,
        }
    ),
    note_imminent_preimage_operational: createCall(
        'Democracy.note_imminent_preimage_operational',
        {
            v2005: v2005.DemocracyNoteImminentPreimageOperationalCall,
            v9111: v9111.DemocracyNoteImminentPreimageOperationalCall,
        }
    ),
    note_preimage: createCall(
        'Democracy.note_preimage',
        {
            v1022: v1022.DemocracyNotePreimageCall,
            v9111: v9111.DemocracyNotePreimageCall,
        }
    ),
    note_preimage_operational: createCall(
        'Democracy.note_preimage_operational',
        {
            v2005: v2005.DemocracyNotePreimageOperationalCall,
            v9111: v9111.DemocracyNotePreimageOperationalCall,
        }
    ),
    open_proxy: createCall(
        'Democracy.open_proxy',
        {
            v1050: v1050.DemocracyOpenProxyCall,
        }
    ),
    propose: createCall(
        'Democracy.propose',
        {
            v1020: v1020.DemocracyProposeCall,
            v1022: v1022.DemocracyProposeCall,
            v9111: v9111.DemocracyProposeCall,
            v9320: v9320.DemocracyProposeCall,
        }
    ),
    proxy_delegate: createCall(
        'Democracy.proxy_delegate',
        {
            v1055: v1055.DemocracyProxyDelegateCall,
        }
    ),
    proxy_remove_vote: createCall(
        'Democracy.proxy_remove_vote',
        {
            v1055: v1055.DemocracyProxyRemoveVoteCall,
        }
    ),
    proxy_undelegate: createCall(
        'Democracy.proxy_undelegate',
        {
            v1055: v1055.DemocracyProxyUndelegateCall,
        }
    ),
    proxy_vote: createCall(
        'Democracy.proxy_vote',
        {
            v1020: v1020.DemocracyProxyVoteCall,
            v1055: v1055.DemocracyProxyVoteCall,
        }
    ),
    reap_preimage: createCall(
        'Democracy.reap_preimage',
        {
            v1022: v1022.DemocracyReapPreimageCall,
            v2005: v2005.DemocracyReapPreimageCall,
            v9111: v9111.DemocracyReapPreimageCall,
        }
    ),
    remove_other_vote: createCall(
        'Democracy.remove_other_vote',
        {
            v1055: v1055.DemocracyRemoveOtherVoteCall,
            v9291: v9291.DemocracyRemoveOtherVoteCall,
        }
    ),
    remove_proxy: createCall(
        'Democracy.remove_proxy',
        {
            v1020: v1020.DemocracyRemoveProxyCall,
        }
    ),
    remove_vote: createCall(
        'Democracy.remove_vote',
        {
            v1055: v1055.DemocracyRemoveVoteCall,
        }
    ),
    resign_proxy: createCall(
        'Democracy.resign_proxy',
        {
            v1020: v1020.DemocracyResignProxyCall,
        }
    ),
    second: createCall(
        'Democracy.second',
        {
            v1020: v1020.DemocracySecondCall,
            v2005: v2005.DemocracySecondCall,
            v9111: v9111.DemocracySecondCall,
            v9320: v9320.DemocracySecondCall,
        }
    ),
    set_proxy: createCall(
        'Democracy.set_proxy',
        {
            v1020: v1020.DemocracySetProxyCall,
        }
    ),
    undelegate: createCall(
        'Democracy.undelegate',
        {
            v1020: v1020.DemocracyUndelegateCall,
        }
    ),
    unlock: createCall(
        'Democracy.unlock',
        {
            v1050: v1050.DemocracyUnlockCall,
            v9291: v9291.DemocracyUnlockCall,
        }
    ),
    veto_external: createCall(
        'Democracy.veto_external',
        {
            v1020: v1020.DemocracyVetoExternalCall,
            v9111: v9111.DemocracyVetoExternalCall,
        }
    ),
    vote: createCall(
        'Democracy.vote',
        {
            v1020: v1020.DemocracyVoteCall,
            v1055: v1055.DemocracyVoteCall,
            v9111: v9111.DemocracyVoteCall,
        }
    ),
}

export const constants = {
    CooloffPeriod: createConstant(
        'Democracy.CooloffPeriod',
        {
            v1020: v1020.DemocracyCooloffPeriodConstant,
        }
    ),
    EmergencyVotingPeriod: createConstant(
        'Democracy.EmergencyVotingPeriod',
        {
            v1020: v1020.DemocracyEmergencyVotingPeriodConstant,
        }
    ),
    EnactmentPeriod: createConstant(
        'Democracy.EnactmentPeriod',
        {
            v1020: v1020.DemocracyEnactmentPeriodConstant,
        }
    ),
    FastTrackVotingPeriod: createConstant(
        'Democracy.FastTrackVotingPeriod',
        {
            v1055: v1055.DemocracyFastTrackVotingPeriodConstant,
        }
    ),
    InstantAllowed: createConstant(
        'Democracy.InstantAllowed',
        {
            v9090: v9090.DemocracyInstantAllowedConstant,
        }
    ),
    LaunchPeriod: createConstant(
        'Democracy.LaunchPeriod',
        {
            v1020: v1020.DemocracyLaunchPeriodConstant,
        }
    ),
    MaxBlacklisted: createConstant(
        'Democracy.MaxBlacklisted',
        {
            v9320: v9320.DemocracyMaxBlacklistedConstant,
        }
    ),
    MaxDeposits: createConstant(
        'Democracy.MaxDeposits',
        {
            v9320: v9320.DemocracyMaxDepositsConstant,
        }
    ),
    MaxProposals: createConstant(
        'Democracy.MaxProposals',
        {
            v9090: v9090.DemocracyMaxProposalsConstant,
        }
    ),
    MaxVotes: createConstant(
        'Democracy.MaxVotes',
        {
            v2005: v2005.DemocracyMaxVotesConstant,
        }
    ),
    MinimumDeposit: createConstant(
        'Democracy.MinimumDeposit',
        {
            v1020: v1020.DemocracyMinimumDepositConstant,
        }
    ),
    PreimageByteDeposit: createConstant(
        'Democracy.PreimageByteDeposit',
        {
            v1022: v1022.DemocracyPreimageByteDepositConstant,
        }
    ),
    VoteLockingPeriod: createConstant(
        'Democracy.VoteLockingPeriod',
        {
            v9111: v9111.DemocracyVoteLockingPeriodConstant,
        }
    ),
    VotingPeriod: createConstant(
        'Democracy.VotingPeriod',
        {
            v1020: v1020.DemocracyVotingPeriodConstant,
        }
    ),
}

export const storage = {
    Blacklist: createStorage(
        'Democracy.Blacklist',
        {
            v1020: v1020.DemocracyBlacklistStorage,
        }
    ),
    Cancellations: createStorage(
        'Democracy.Cancellations',
        {
            v1020: v1020.DemocracyCancellationsStorage,
        }
    ),
    Delegations: createStorage(
        'Democracy.Delegations',
        {
            v1020: v1020.DemocracyDelegationsStorage,
        }
    ),
    DepositOf: createStorage(
        'Democracy.DepositOf',
        {
            v1020: v1020.DemocracyDepositOfStorage,
            v2005: v2005.DemocracyDepositOfStorage,
        }
    ),
    DispatchQueue: createStorage(
        'Democracy.DispatchQueue',
        {
            v1020: v1020.DemocracyDispatchQueueStorage,
            v1022: v1022.DemocracyDispatchQueueStorage,
            v1030: v1030.DemocracyDispatchQueueStorage,
        }
    ),
    LastTabledWasExternal: createStorage(
        'Democracy.LastTabledWasExternal',
        {
            v1020: v1020.DemocracyLastTabledWasExternalStorage,
        }
    ),
    Locks: createStorage(
        'Democracy.Locks',
        {
            v1050: v1050.DemocracyLocksStorage,
        }
    ),
    LowestUnbaked: createStorage(
        'Democracy.LowestUnbaked',
        {
            v1030: v1030.DemocracyLowestUnbakedStorage,
        }
    ),
    NextExternal: createStorage(
        'Democracy.NextExternal',
        {
            v1020: v1020.DemocracyNextExternalStorage,
            v1022: v1022.DemocracyNextExternalStorage,
            v9320: v9320.DemocracyNextExternalStorage,
        }
    ),
    NextTally: createStorage(
        'Democracy.NextTally',
        {
            v1020: v1020.DemocracyNextTallyStorage,
        }
    ),
    Preimages: createStorage(
        'Democracy.Preimages',
        {
            v1022: v1022.DemocracyPreimagesStorage,
            v1058: v1058.DemocracyPreimagesStorage,
            v9111: v9111.DemocracyPreimagesStorage,
        }
    ),
    Proxy: createStorage(
        'Democracy.Proxy',
        {
            v1020: v1020.DemocracyProxyStorage,
            v1050: v1050.DemocracyProxyStorage,
        }
    ),
    PublicPropCount: createStorage(
        'Democracy.PublicPropCount',
        {
            v1020: v1020.DemocracyPublicPropCountStorage,
        }
    ),
    PublicProps: createStorage(
        'Democracy.PublicProps',
        {
            v1020: v1020.DemocracyPublicPropsStorage,
            v1022: v1022.DemocracyPublicPropsStorage,
            v9320: v9320.DemocracyPublicPropsStorage,
        }
    ),
    ReferendumCount: createStorage(
        'Democracy.ReferendumCount',
        {
            v1020: v1020.DemocracyReferendumCountStorage,
        }
    ),
    ReferendumInfoOf: createStorage(
        'Democracy.ReferendumInfoOf',
        {
            v1020: v1020.DemocracyReferendumInfoOfStorage,
            v1055: v1055.DemocracyReferendumInfoOfStorage,
            v9111: v9111.DemocracyReferendumInfoOfStorage,
            v9320: v9320.DemocracyReferendumInfoOfStorage,
        }
    ),
    StorageVersion: createStorage(
        'Democracy.StorageVersion',
        {
            v2005: v2005.DemocracyStorageVersionStorage,
            v9111: v9111.DemocracyStorageVersionStorage,
        }
    ),
    VoteOf: createStorage(
        'Democracy.VoteOf',
        {
            v1020: v1020.DemocracyVoteOfStorage,
        }
    ),
    VotersFor: createStorage(
        'Democracy.VotersFor',
        {
            v1020: v1020.DemocracyVotersForStorage,
        }
    ),
    VotingOf: createStorage(
        'Democracy.VotingOf',
        {
            v1055: v1055.DemocracyVotingOfStorage,
            v9111: v9111.DemocracyVotingOfStorage,
        }
    ),
}

export default {events, calls, constants}
