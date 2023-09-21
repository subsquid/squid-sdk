import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9420 from './types/v9420'
import * as v9291 from './types/v9291'
import * as v9160 from './types/v9160'
import * as v9111 from './types/v9111'
import * as v9010 from './types/v9010'
import * as v2030 from './types/v2030'
import * as v2028 from './types/v2028'
import * as v2015 from './types/v2015'
import * as v1062 from './types/v1062'
import * as v1050 from './types/v1050'
import * as v1042 from './types/v1042'
import * as v1040 from './types/v1040'

export const events = {
    AutoUnbid: createEvent(
        'Society.AutoUnbid',
        {
            v1040: v1040.SocietyAutoUnbidEvent,
            v9160: v9160.SocietyAutoUnbidEvent,
        }
    ),
    Bid: createEvent(
        'Society.Bid',
        {
            v1040: v1040.SocietyBidEvent,
            v9160: v9160.SocietyBidEvent,
        }
    ),
    CandidateSuspended: createEvent(
        'Society.CandidateSuspended',
        {
            v1040: v1040.SocietyCandidateSuspendedEvent,
            v9160: v9160.SocietyCandidateSuspendedEvent,
        }
    ),
    Challenged: createEvent(
        'Society.Challenged',
        {
            v1040: v1040.SocietyChallengedEvent,
            v9160: v9160.SocietyChallengedEvent,
        }
    ),
    DefenderVote: createEvent(
        'Society.DefenderVote',
        {
            v1040: v1040.SocietyDefenderVoteEvent,
            v9160: v9160.SocietyDefenderVoteEvent,
        }
    ),
    Deposit: createEvent(
        'Society.Deposit',
        {
            v2015: v2015.SocietyDepositEvent,
            v9160: v9160.SocietyDepositEvent,
        }
    ),
    Founded: createEvent(
        'Society.Founded',
        {
            v1040: v1040.SocietyFoundedEvent,
            v9160: v9160.SocietyFoundedEvent,
        }
    ),
    Inducted: createEvent(
        'Society.Inducted',
        {
            v1040: v1040.SocietyInductedEvent,
            v9160: v9160.SocietyInductedEvent,
        }
    ),
    MemberSuspended: createEvent(
        'Society.MemberSuspended',
        {
            v1040: v1040.SocietyMemberSuspendedEvent,
            v9160: v9160.SocietyMemberSuspendedEvent,
        }
    ),
    NewMaxMembers: createEvent(
        'Society.NewMaxMembers',
        {
            v1040: v1040.SocietyNewMaxMembersEvent,
            v9160: v9160.SocietyNewMaxMembersEvent,
        }
    ),
    SkepticsChosen: createEvent(
        'Society.SkepticsChosen',
        {
            v9420: v9420.SocietySkepticsChosenEvent,
        }
    ),
    SuspendedMemberJudgement: createEvent(
        'Society.SuspendedMemberJudgement',
        {
            v1040: v1040.SocietySuspendedMemberJudgementEvent,
            v9160: v9160.SocietySuspendedMemberJudgementEvent,
        }
    ),
    Unbid: createEvent(
        'Society.Unbid',
        {
            v1040: v1040.SocietyUnbidEvent,
            v9160: v9160.SocietyUnbidEvent,
        }
    ),
    Unfounded: createEvent(
        'Society.Unfounded',
        {
            v1042: v1042.SocietyUnfoundedEvent,
            v9160: v9160.SocietyUnfoundedEvent,
        }
    ),
    Unvouch: createEvent(
        'Society.Unvouch',
        {
            v1040: v1040.SocietyUnvouchEvent,
            v9160: v9160.SocietyUnvouchEvent,
        }
    ),
    Vote: createEvent(
        'Society.Vote',
        {
            v1040: v1040.SocietyVoteEvent,
            v9160: v9160.SocietyVoteEvent,
        }
    ),
    Vouch: createEvent(
        'Society.Vouch',
        {
            v1040: v1040.SocietyVouchEvent,
            v9160: v9160.SocietyVouchEvent,
        }
    ),
}

export const calls = {
    bid: createCall(
        'Society.bid',
        {
            v1040: v1040.SocietyBidCall,
        }
    ),
    defender_vote: createCall(
        'Society.defender_vote',
        {
            v1040: v1040.SocietyDefenderVoteCall,
        }
    ),
    found: createCall(
        'Society.found',
        {
            v1040: v1040.SocietyFoundCall,
            v1042: v1042.SocietyFoundCall,
            v9111: v9111.SocietyFoundCall,
            v9291: v9291.SocietyFoundCall,
        }
    ),
    judge_suspended_candidate: createCall(
        'Society.judge_suspended_candidate',
        {
            v1040: v1040.SocietyJudgeSuspendedCandidateCall,
            v9291: v9291.SocietyJudgeSuspendedCandidateCall,
        }
    ),
    judge_suspended_member: createCall(
        'Society.judge_suspended_member',
        {
            v1040: v1040.SocietyJudgeSuspendedMemberCall,
            v9291: v9291.SocietyJudgeSuspendedMemberCall,
        }
    ),
    payout: createCall(
        'Society.payout',
        {
            v1040: v1040.SocietyPayoutCall,
        }
    ),
    set_max_members: createCall(
        'Society.set_max_members',
        {
            v1040: v1040.SocietySetMaxMembersCall,
        }
    ),
    unbid: createCall(
        'Society.unbid',
        {
            v1040: v1040.SocietyUnbidCall,
        }
    ),
    unfound: createCall(
        'Society.unfound',
        {
            v1042: v1042.SocietyUnfoundCall,
        }
    ),
    unvouch: createCall(
        'Society.unvouch',
        {
            v1040: v1040.SocietyUnvouchCall,
        }
    ),
    vote: createCall(
        'Society.vote',
        {
            v1040: v1040.SocietyVoteCall,
            v1050: v1050.SocietyVoteCall,
            v2028: v2028.SocietyVoteCall,
            v9111: v9111.SocietyVoteCall,
        }
    ),
    vouch: createCall(
        'Society.vouch',
        {
            v1040: v1040.SocietyVouchCall,
            v9291: v9291.SocietyVouchCall,
        }
    ),
}

export const constants = {
    CandidateDeposit: createConstant(
        'Society.CandidateDeposit',
        {
            v1040: v1040.SocietyCandidateDepositConstant,
        }
    ),
    ChallengePeriod: createConstant(
        'Society.ChallengePeriod',
        {
            v1040: v1040.SocietyChallengePeriodConstant,
        }
    ),
    MaxCandidateIntake: createConstant(
        'Society.MaxCandidateIntake',
        {
            v2030: v2030.SocietyMaxCandidateIntakeConstant,
        }
    ),
    MaxLockDuration: createConstant(
        'Society.MaxLockDuration',
        {
            v9111: v9111.SocietyMaxLockDurationConstant,
        }
    ),
    MaxStrikes: createConstant(
        'Society.MaxStrikes',
        {
            v1040: v1040.SocietyMaxStrikesConstant,
        }
    ),
    ModuleId: createConstant(
        'Society.ModuleId',
        {
            v1062: v1062.SocietyModuleIdConstant,
        }
    ),
    PalletId: createConstant(
        'Society.PalletId',
        {
            v9010: v9010.SocietyPalletIdConstant,
        }
    ),
    PeriodSpend: createConstant(
        'Society.PeriodSpend',
        {
            v1040: v1040.SocietyPeriodSpendConstant,
        }
    ),
    RotationPeriod: createConstant(
        'Society.RotationPeriod',
        {
            v1040: v1040.SocietyRotationPeriodConstant,
        }
    ),
    WrongSideDeduction: createConstant(
        'Society.WrongSideDeduction',
        {
            v1040: v1040.SocietyWrongSideDeductionConstant,
        }
    ),
}

export const storage = {
    Bids: createStorage(
        'Society.Bids',
        {
            v1040: v1040.SocietyBidsStorage,
            v9111: v9111.SocietyBidsStorage,
        }
    ),
    Candidates: createStorage(
        'Society.Candidates',
        {
            v1040: v1040.SocietyCandidatesStorage,
            v9111: v9111.SocietyCandidatesStorage,
        }
    ),
    Defender: createStorage(
        'Society.Defender',
        {
            v1040: v1040.SocietyDefenderStorage,
        }
    ),
    DefenderVotes: createStorage(
        'Society.DefenderVotes',
        {
            v1040: v1040.SocietyDefenderVotesStorage,
        }
    ),
    Founder: createStorage(
        'Society.Founder',
        {
            v1040: v1040.SocietyFounderStorage,
        }
    ),
    Head: createStorage(
        'Society.Head',
        {
            v1040: v1040.SocietyHeadStorage,
        }
    ),
    MaxMembers: createStorage(
        'Society.MaxMembers',
        {
            v1040: v1040.SocietyMaxMembersStorage,
        }
    ),
    Members: createStorage(
        'Society.Members',
        {
            v1040: v1040.SocietyMembersStorage,
        }
    ),
    Payouts: createStorage(
        'Society.Payouts',
        {
            v1040: v1040.SocietyPayoutsStorage,
        }
    ),
    Pot: createStorage(
        'Society.Pot',
        {
            v1040: v1040.SocietyPotStorage,
        }
    ),
    Rules: createStorage(
        'Society.Rules',
        {
            v1042: v1042.SocietyRulesStorage,
        }
    ),
    Strikes: createStorage(
        'Society.Strikes',
        {
            v1040: v1040.SocietyStrikesStorage,
        }
    ),
    SuspendedCandidates: createStorage(
        'Society.SuspendedCandidates',
        {
            v1040: v1040.SocietySuspendedCandidatesStorage,
            v9111: v9111.SocietySuspendedCandidatesStorage,
        }
    ),
    SuspendedMembers: createStorage(
        'Society.SuspendedMembers',
        {
            v1040: v1040.SocietySuspendedMembersStorage,
            v1042: v1042.SocietySuspendedMembersStorage,
        }
    ),
    Votes: createStorage(
        'Society.Votes',
        {
            v1040: v1040.SocietyVotesStorage,
        }
    ),
    Vouching: createStorage(
        'Society.Vouching',
        {
            v1040: v1040.SocietyVouchingStorage,
        }
    ),
}

export default {events, calls, constants}
