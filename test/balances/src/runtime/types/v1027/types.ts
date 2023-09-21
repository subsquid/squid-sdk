import {sts, Result, Option, Bytes} from '../../pallet.support'

export type Proposal = Proposal_Attestations | Proposal_AuthorityDiscovery | Proposal_Authorship | Proposal_Babe | Proposal_Balances | Proposal_Claims | Proposal_Council | Proposal_Democracy | Proposal_ElectionsPhragmen | Proposal_FinalityTracker | Proposal_Grandpa | Proposal_ImOnline | Proposal_Indices | Proposal_Nicks | Proposal_Offences | Proposal_Parachains | Proposal_Registrar | Proposal_Session | Proposal_Slots | Proposal_Staking | Proposal_System | Proposal_TechnicalCommittee | Proposal_TechnicalMembership | Proposal_Timestamp | Proposal_Treasury

export interface Proposal_Attestations {
    __kind: 'Attestations'
    value: AttestationsCall
}

export interface Proposal_AuthorityDiscovery {
    __kind: 'AuthorityDiscovery'
    value: AuthorityDiscoveryCall
}

export interface Proposal_Authorship {
    __kind: 'Authorship'
    value: AuthorshipCall
}

export interface Proposal_Babe {
    __kind: 'Babe'
    value: BabeCall
}

export interface Proposal_Balances {
    __kind: 'Balances'
    value: BalancesCall
}

export interface Proposal_Claims {
    __kind: 'Claims'
    value: ClaimsCall
}

export interface Proposal_Council {
    __kind: 'Council'
    value: CouncilCall
}

export interface Proposal_Democracy {
    __kind: 'Democracy'
    value: DemocracyCall
}

export interface Proposal_ElectionsPhragmen {
    __kind: 'ElectionsPhragmen'
    value: ElectionsPhragmenCall
}

export interface Proposal_FinalityTracker {
    __kind: 'FinalityTracker'
    value: FinalityTrackerCall
}

export interface Proposal_Grandpa {
    __kind: 'Grandpa'
    value: GrandpaCall
}

export interface Proposal_ImOnline {
    __kind: 'ImOnline'
    value: ImOnlineCall
}

export interface Proposal_Indices {
    __kind: 'Indices'
    value: IndicesCall
}

export interface Proposal_Nicks {
    __kind: 'Nicks'
    value: NicksCall
}

export interface Proposal_Offences {
    __kind: 'Offences'
    value: OffencesCall
}

export interface Proposal_Parachains {
    __kind: 'Parachains'
    value: ParachainsCall
}

export interface Proposal_Registrar {
    __kind: 'Registrar'
    value: RegistrarCall
}

export interface Proposal_Session {
    __kind: 'Session'
    value: SessionCall
}

export interface Proposal_Slots {
    __kind: 'Slots'
    value: SlotsCall
}

export interface Proposal_Staking {
    __kind: 'Staking'
    value: StakingCall
}

export interface Proposal_System {
    __kind: 'System'
    value: SystemCall
}

export interface Proposal_TechnicalCommittee {
    __kind: 'TechnicalCommittee'
    value: TechnicalCommitteeCall
}

export interface Proposal_TechnicalMembership {
    __kind: 'TechnicalMembership'
    value: TechnicalMembershipCall
}

export interface Proposal_Timestamp {
    __kind: 'Timestamp'
    value: TimestampCall
}

export interface Proposal_Treasury {
    __kind: 'Treasury'
    value: TreasuryCall
}

export const Proposal: sts.Type<Proposal> = sts.closedEnum(() => {
    return  {
        Attestations: AttestationsCall,
        AuthorityDiscovery: AuthorityDiscoveryCall,
        Authorship: AuthorshipCall,
        Babe: BabeCall,
        Balances: BalancesCall,
        Claims: ClaimsCall,
        Council: CouncilCall,
        Democracy: DemocracyCall,
        ElectionsPhragmen: ElectionsPhragmenCall,
        FinalityTracker: FinalityTrackerCall,
        Grandpa: GrandpaCall,
        ImOnline: ImOnlineCall,
        Indices: IndicesCall,
        Nicks: NicksCall,
        Offences: OffencesCall,
        Parachains: ParachainsCall,
        Registrar: RegistrarCall,
        Session: SessionCall,
        Slots: SlotsCall,
        Staking: StakingCall,
        System: SystemCall,
        TechnicalCommittee: TechnicalCommitteeCall,
        TechnicalMembership: TechnicalMembershipCall,
        Timestamp: TimestampCall,
        Treasury: TreasuryCall,
    }
})

export type TreasuryCall = TreasuryCall_approve_proposal | TreasuryCall_propose_spend | TreasuryCall_reject_proposal

/**
 *  Approve a proposal. At a later time, the proposal will be allocated to the beneficiary
 *  and the original deposit will be returned.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB change.
 *  # </weight>
 */
export interface TreasuryCall_approve_proposal {
    __kind: 'approve_proposal'
    proposalId: number,
}

/**
 *  Put forward a suggestion for spending. A deposit proportional to the value
 *  is reserved and slashed if the proposal is rejected. It is returned once the
 *  proposal is awarded.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB change, one extra DB entry.
 *  # </weight>
 */
export interface TreasuryCall_propose_spend {
    __kind: 'propose_spend'
    value: bigint,
    beneficiary: LookupSource,
}

/**
 *  Reject a proposed spend. The original deposit will be slashed.
 * 
 *  # <weight>
 *  - O(1).
 *  - Limited storage reads.
 *  - One DB clear.
 *  # </weight>
 */
export interface TreasuryCall_reject_proposal {
    __kind: 'reject_proposal'
    proposalId: number,
}

export const TreasuryCall: sts.Type<TreasuryCall> = sts.closedEnum(() => {
    return  {
        approve_proposal: sts.enumStruct({
            proposalId: sts.number(),
        }),
        propose_spend: sts.enumStruct({
            value: sts.bigint(),
            beneficiary: LookupSource,
        }),
        reject_proposal: sts.enumStruct({
            proposalId: sts.number(),
        }),
    }
})

export type LookupSource = LookupSource_AccountId | LookupSource_Idx0 | LookupSource_Idx1 | LookupSource_Idx10 | LookupSource_Idx100 | LookupSource_Idx101 | LookupSource_Idx102 | LookupSource_Idx103 | LookupSource_Idx104 | LookupSource_Idx105 | LookupSource_Idx106 | LookupSource_Idx107 | LookupSource_Idx108 | LookupSource_Idx109 | LookupSource_Idx11 | LookupSource_Idx110 | LookupSource_Idx111 | LookupSource_Idx112 | LookupSource_Idx113 | LookupSource_Idx114 | LookupSource_Idx115 | LookupSource_Idx116 | LookupSource_Idx117 | LookupSource_Idx118 | LookupSource_Idx119 | LookupSource_Idx12 | LookupSource_Idx120 | LookupSource_Idx121 | LookupSource_Idx122 | LookupSource_Idx123 | LookupSource_Idx124 | LookupSource_Idx125 | LookupSource_Idx126 | LookupSource_Idx127 | LookupSource_Idx128 | LookupSource_Idx129 | LookupSource_Idx13 | LookupSource_Idx130 | LookupSource_Idx131 | LookupSource_Idx132 | LookupSource_Idx133 | LookupSource_Idx134 | LookupSource_Idx135 | LookupSource_Idx136 | LookupSource_Idx137 | LookupSource_Idx138 | LookupSource_Idx139 | LookupSource_Idx14 | LookupSource_Idx140 | LookupSource_Idx141 | LookupSource_Idx142 | LookupSource_Idx143 | LookupSource_Idx144 | LookupSource_Idx145 | LookupSource_Idx146 | LookupSource_Idx147 | LookupSource_Idx148 | LookupSource_Idx149 | LookupSource_Idx15 | LookupSource_Idx150 | LookupSource_Idx151 | LookupSource_Idx152 | LookupSource_Idx153 | LookupSource_Idx154 | LookupSource_Idx155 | LookupSource_Idx156 | LookupSource_Idx157 | LookupSource_Idx158 | LookupSource_Idx159 | LookupSource_Idx16 | LookupSource_Idx160 | LookupSource_Idx161 | LookupSource_Idx162 | LookupSource_Idx163 | LookupSource_Idx164 | LookupSource_Idx165 | LookupSource_Idx166 | LookupSource_Idx167 | LookupSource_Idx168 | LookupSource_Idx169 | LookupSource_Idx17 | LookupSource_Idx170 | LookupSource_Idx171 | LookupSource_Idx172 | LookupSource_Idx173 | LookupSource_Idx174 | LookupSource_Idx175 | LookupSource_Idx176 | LookupSource_Idx177 | LookupSource_Idx178 | LookupSource_Idx179 | LookupSource_Idx18 | LookupSource_Idx180 | LookupSource_Idx181 | LookupSource_Idx182 | LookupSource_Idx183 | LookupSource_Idx184 | LookupSource_Idx185 | LookupSource_Idx186 | LookupSource_Idx187 | LookupSource_Idx188 | LookupSource_Idx189 | LookupSource_Idx19 | LookupSource_Idx190 | LookupSource_Idx191 | LookupSource_Idx192 | LookupSource_Idx193 | LookupSource_Idx194 | LookupSource_Idx195 | LookupSource_Idx196 | LookupSource_Idx197 | LookupSource_Idx198 | LookupSource_Idx199 | LookupSource_Idx2 | LookupSource_Idx20 | LookupSource_Idx200 | LookupSource_Idx201 | LookupSource_Idx202 | LookupSource_Idx203 | LookupSource_Idx204 | LookupSource_Idx205 | LookupSource_Idx206 | LookupSource_Idx207 | LookupSource_Idx208 | LookupSource_Idx209 | LookupSource_Idx21 | LookupSource_Idx210 | LookupSource_Idx211 | LookupSource_Idx212 | LookupSource_Idx213 | LookupSource_Idx214 | LookupSource_Idx215 | LookupSource_Idx216 | LookupSource_Idx217 | LookupSource_Idx218 | LookupSource_Idx219 | LookupSource_Idx22 | LookupSource_Idx220 | LookupSource_Idx221 | LookupSource_Idx222 | LookupSource_Idx223 | LookupSource_Idx224 | LookupSource_Idx225 | LookupSource_Idx226 | LookupSource_Idx227 | LookupSource_Idx228 | LookupSource_Idx229 | LookupSource_Idx23 | LookupSource_Idx230 | LookupSource_Idx231 | LookupSource_Idx232 | LookupSource_Idx233 | LookupSource_Idx234 | LookupSource_Idx235 | LookupSource_Idx236 | LookupSource_Idx237 | LookupSource_Idx238 | LookupSource_Idx24 | LookupSource_Idx25 | LookupSource_Idx26 | LookupSource_Idx27 | LookupSource_Idx28 | LookupSource_Idx29 | LookupSource_Idx3 | LookupSource_Idx30 | LookupSource_Idx31 | LookupSource_Idx32 | LookupSource_Idx33 | LookupSource_Idx34 | LookupSource_Idx35 | LookupSource_Idx36 | LookupSource_Idx37 | LookupSource_Idx38 | LookupSource_Idx39 | LookupSource_Idx4 | LookupSource_Idx40 | LookupSource_Idx41 | LookupSource_Idx42 | LookupSource_Idx43 | LookupSource_Idx44 | LookupSource_Idx45 | LookupSource_Idx46 | LookupSource_Idx47 | LookupSource_Idx48 | LookupSource_Idx49 | LookupSource_Idx5 | LookupSource_Idx50 | LookupSource_Idx51 | LookupSource_Idx52 | LookupSource_Idx53 | LookupSource_Idx54 | LookupSource_Idx55 | LookupSource_Idx56 | LookupSource_Idx57 | LookupSource_Idx58 | LookupSource_Idx59 | LookupSource_Idx6 | LookupSource_Idx60 | LookupSource_Idx61 | LookupSource_Idx62 | LookupSource_Idx63 | LookupSource_Idx64 | LookupSource_Idx65 | LookupSource_Idx66 | LookupSource_Idx67 | LookupSource_Idx68 | LookupSource_Idx69 | LookupSource_Idx7 | LookupSource_Idx70 | LookupSource_Idx71 | LookupSource_Idx72 | LookupSource_Idx73 | LookupSource_Idx74 | LookupSource_Idx75 | LookupSource_Idx76 | LookupSource_Idx77 | LookupSource_Idx78 | LookupSource_Idx79 | LookupSource_Idx8 | LookupSource_Idx80 | LookupSource_Idx81 | LookupSource_Idx82 | LookupSource_Idx83 | LookupSource_Idx84 | LookupSource_Idx85 | LookupSource_Idx86 | LookupSource_Idx87 | LookupSource_Idx88 | LookupSource_Idx89 | LookupSource_Idx9 | LookupSource_Idx90 | LookupSource_Idx91 | LookupSource_Idx92 | LookupSource_Idx93 | LookupSource_Idx94 | LookupSource_Idx95 | LookupSource_Idx96 | LookupSource_Idx97 | LookupSource_Idx98 | LookupSource_Idx99 | LookupSource_IdxU16 | LookupSource_IdxU32 | LookupSource_IdxU64

export interface LookupSource_AccountId {
    __kind: 'AccountId'
    value: AccountId
}

export interface LookupSource_Idx0 {
    __kind: 'Idx0'
}

export interface LookupSource_Idx1 {
    __kind: 'Idx1'
}

export interface LookupSource_Idx10 {
    __kind: 'Idx10'
}

export interface LookupSource_Idx100 {
    __kind: 'Idx100'
}

export interface LookupSource_Idx101 {
    __kind: 'Idx101'
}

export interface LookupSource_Idx102 {
    __kind: 'Idx102'
}

export interface LookupSource_Idx103 {
    __kind: 'Idx103'
}

export interface LookupSource_Idx104 {
    __kind: 'Idx104'
}

export interface LookupSource_Idx105 {
    __kind: 'Idx105'
}

export interface LookupSource_Idx106 {
    __kind: 'Idx106'
}

export interface LookupSource_Idx107 {
    __kind: 'Idx107'
}

export interface LookupSource_Idx108 {
    __kind: 'Idx108'
}

export interface LookupSource_Idx109 {
    __kind: 'Idx109'
}

export interface LookupSource_Idx11 {
    __kind: 'Idx11'
}

export interface LookupSource_Idx110 {
    __kind: 'Idx110'
}

export interface LookupSource_Idx111 {
    __kind: 'Idx111'
}

export interface LookupSource_Idx112 {
    __kind: 'Idx112'
}

export interface LookupSource_Idx113 {
    __kind: 'Idx113'
}

export interface LookupSource_Idx114 {
    __kind: 'Idx114'
}

export interface LookupSource_Idx115 {
    __kind: 'Idx115'
}

export interface LookupSource_Idx116 {
    __kind: 'Idx116'
}

export interface LookupSource_Idx117 {
    __kind: 'Idx117'
}

export interface LookupSource_Idx118 {
    __kind: 'Idx118'
}

export interface LookupSource_Idx119 {
    __kind: 'Idx119'
}

export interface LookupSource_Idx12 {
    __kind: 'Idx12'
}

export interface LookupSource_Idx120 {
    __kind: 'Idx120'
}

export interface LookupSource_Idx121 {
    __kind: 'Idx121'
}

export interface LookupSource_Idx122 {
    __kind: 'Idx122'
}

export interface LookupSource_Idx123 {
    __kind: 'Idx123'
}

export interface LookupSource_Idx124 {
    __kind: 'Idx124'
}

export interface LookupSource_Idx125 {
    __kind: 'Idx125'
}

export interface LookupSource_Idx126 {
    __kind: 'Idx126'
}

export interface LookupSource_Idx127 {
    __kind: 'Idx127'
}

export interface LookupSource_Idx128 {
    __kind: 'Idx128'
}

export interface LookupSource_Idx129 {
    __kind: 'Idx129'
}

export interface LookupSource_Idx13 {
    __kind: 'Idx13'
}

export interface LookupSource_Idx130 {
    __kind: 'Idx130'
}

export interface LookupSource_Idx131 {
    __kind: 'Idx131'
}

export interface LookupSource_Idx132 {
    __kind: 'Idx132'
}

export interface LookupSource_Idx133 {
    __kind: 'Idx133'
}

export interface LookupSource_Idx134 {
    __kind: 'Idx134'
}

export interface LookupSource_Idx135 {
    __kind: 'Idx135'
}

export interface LookupSource_Idx136 {
    __kind: 'Idx136'
}

export interface LookupSource_Idx137 {
    __kind: 'Idx137'
}

export interface LookupSource_Idx138 {
    __kind: 'Idx138'
}

export interface LookupSource_Idx139 {
    __kind: 'Idx139'
}

export interface LookupSource_Idx14 {
    __kind: 'Idx14'
}

export interface LookupSource_Idx140 {
    __kind: 'Idx140'
}

export interface LookupSource_Idx141 {
    __kind: 'Idx141'
}

export interface LookupSource_Idx142 {
    __kind: 'Idx142'
}

export interface LookupSource_Idx143 {
    __kind: 'Idx143'
}

export interface LookupSource_Idx144 {
    __kind: 'Idx144'
}

export interface LookupSource_Idx145 {
    __kind: 'Idx145'
}

export interface LookupSource_Idx146 {
    __kind: 'Idx146'
}

export interface LookupSource_Idx147 {
    __kind: 'Idx147'
}

export interface LookupSource_Idx148 {
    __kind: 'Idx148'
}

export interface LookupSource_Idx149 {
    __kind: 'Idx149'
}

export interface LookupSource_Idx15 {
    __kind: 'Idx15'
}

export interface LookupSource_Idx150 {
    __kind: 'Idx150'
}

export interface LookupSource_Idx151 {
    __kind: 'Idx151'
}

export interface LookupSource_Idx152 {
    __kind: 'Idx152'
}

export interface LookupSource_Idx153 {
    __kind: 'Idx153'
}

export interface LookupSource_Idx154 {
    __kind: 'Idx154'
}

export interface LookupSource_Idx155 {
    __kind: 'Idx155'
}

export interface LookupSource_Idx156 {
    __kind: 'Idx156'
}

export interface LookupSource_Idx157 {
    __kind: 'Idx157'
}

export interface LookupSource_Idx158 {
    __kind: 'Idx158'
}

export interface LookupSource_Idx159 {
    __kind: 'Idx159'
}

export interface LookupSource_Idx16 {
    __kind: 'Idx16'
}

export interface LookupSource_Idx160 {
    __kind: 'Idx160'
}

export interface LookupSource_Idx161 {
    __kind: 'Idx161'
}

export interface LookupSource_Idx162 {
    __kind: 'Idx162'
}

export interface LookupSource_Idx163 {
    __kind: 'Idx163'
}

export interface LookupSource_Idx164 {
    __kind: 'Idx164'
}

export interface LookupSource_Idx165 {
    __kind: 'Idx165'
}

export interface LookupSource_Idx166 {
    __kind: 'Idx166'
}

export interface LookupSource_Idx167 {
    __kind: 'Idx167'
}

export interface LookupSource_Idx168 {
    __kind: 'Idx168'
}

export interface LookupSource_Idx169 {
    __kind: 'Idx169'
}

export interface LookupSource_Idx17 {
    __kind: 'Idx17'
}

export interface LookupSource_Idx170 {
    __kind: 'Idx170'
}

export interface LookupSource_Idx171 {
    __kind: 'Idx171'
}

export interface LookupSource_Idx172 {
    __kind: 'Idx172'
}

export interface LookupSource_Idx173 {
    __kind: 'Idx173'
}

export interface LookupSource_Idx174 {
    __kind: 'Idx174'
}

export interface LookupSource_Idx175 {
    __kind: 'Idx175'
}

export interface LookupSource_Idx176 {
    __kind: 'Idx176'
}

export interface LookupSource_Idx177 {
    __kind: 'Idx177'
}

export interface LookupSource_Idx178 {
    __kind: 'Idx178'
}

export interface LookupSource_Idx179 {
    __kind: 'Idx179'
}

export interface LookupSource_Idx18 {
    __kind: 'Idx18'
}

export interface LookupSource_Idx180 {
    __kind: 'Idx180'
}

export interface LookupSource_Idx181 {
    __kind: 'Idx181'
}

export interface LookupSource_Idx182 {
    __kind: 'Idx182'
}

export interface LookupSource_Idx183 {
    __kind: 'Idx183'
}

export interface LookupSource_Idx184 {
    __kind: 'Idx184'
}

export interface LookupSource_Idx185 {
    __kind: 'Idx185'
}

export interface LookupSource_Idx186 {
    __kind: 'Idx186'
}

export interface LookupSource_Idx187 {
    __kind: 'Idx187'
}

export interface LookupSource_Idx188 {
    __kind: 'Idx188'
}

export interface LookupSource_Idx189 {
    __kind: 'Idx189'
}

export interface LookupSource_Idx19 {
    __kind: 'Idx19'
}

export interface LookupSource_Idx190 {
    __kind: 'Idx190'
}

export interface LookupSource_Idx191 {
    __kind: 'Idx191'
}

export interface LookupSource_Idx192 {
    __kind: 'Idx192'
}

export interface LookupSource_Idx193 {
    __kind: 'Idx193'
}

export interface LookupSource_Idx194 {
    __kind: 'Idx194'
}

export interface LookupSource_Idx195 {
    __kind: 'Idx195'
}

export interface LookupSource_Idx196 {
    __kind: 'Idx196'
}

export interface LookupSource_Idx197 {
    __kind: 'Idx197'
}

export interface LookupSource_Idx198 {
    __kind: 'Idx198'
}

export interface LookupSource_Idx199 {
    __kind: 'Idx199'
}

export interface LookupSource_Idx2 {
    __kind: 'Idx2'
}

export interface LookupSource_Idx20 {
    __kind: 'Idx20'
}

export interface LookupSource_Idx200 {
    __kind: 'Idx200'
}

export interface LookupSource_Idx201 {
    __kind: 'Idx201'
}

export interface LookupSource_Idx202 {
    __kind: 'Idx202'
}

export interface LookupSource_Idx203 {
    __kind: 'Idx203'
}

export interface LookupSource_Idx204 {
    __kind: 'Idx204'
}

export interface LookupSource_Idx205 {
    __kind: 'Idx205'
}

export interface LookupSource_Idx206 {
    __kind: 'Idx206'
}

export interface LookupSource_Idx207 {
    __kind: 'Idx207'
}

export interface LookupSource_Idx208 {
    __kind: 'Idx208'
}

export interface LookupSource_Idx209 {
    __kind: 'Idx209'
}

export interface LookupSource_Idx21 {
    __kind: 'Idx21'
}

export interface LookupSource_Idx210 {
    __kind: 'Idx210'
}

export interface LookupSource_Idx211 {
    __kind: 'Idx211'
}

export interface LookupSource_Idx212 {
    __kind: 'Idx212'
}

export interface LookupSource_Idx213 {
    __kind: 'Idx213'
}

export interface LookupSource_Idx214 {
    __kind: 'Idx214'
}

export interface LookupSource_Idx215 {
    __kind: 'Idx215'
}

export interface LookupSource_Idx216 {
    __kind: 'Idx216'
}

export interface LookupSource_Idx217 {
    __kind: 'Idx217'
}

export interface LookupSource_Idx218 {
    __kind: 'Idx218'
}

export interface LookupSource_Idx219 {
    __kind: 'Idx219'
}

export interface LookupSource_Idx22 {
    __kind: 'Idx22'
}

export interface LookupSource_Idx220 {
    __kind: 'Idx220'
}

export interface LookupSource_Idx221 {
    __kind: 'Idx221'
}

export interface LookupSource_Idx222 {
    __kind: 'Idx222'
}

export interface LookupSource_Idx223 {
    __kind: 'Idx223'
}

export interface LookupSource_Idx224 {
    __kind: 'Idx224'
}

export interface LookupSource_Idx225 {
    __kind: 'Idx225'
}

export interface LookupSource_Idx226 {
    __kind: 'Idx226'
}

export interface LookupSource_Idx227 {
    __kind: 'Idx227'
}

export interface LookupSource_Idx228 {
    __kind: 'Idx228'
}

export interface LookupSource_Idx229 {
    __kind: 'Idx229'
}

export interface LookupSource_Idx23 {
    __kind: 'Idx23'
}

export interface LookupSource_Idx230 {
    __kind: 'Idx230'
}

export interface LookupSource_Idx231 {
    __kind: 'Idx231'
}

export interface LookupSource_Idx232 {
    __kind: 'Idx232'
}

export interface LookupSource_Idx233 {
    __kind: 'Idx233'
}

export interface LookupSource_Idx234 {
    __kind: 'Idx234'
}

export interface LookupSource_Idx235 {
    __kind: 'Idx235'
}

export interface LookupSource_Idx236 {
    __kind: 'Idx236'
}

export interface LookupSource_Idx237 {
    __kind: 'Idx237'
}

export interface LookupSource_Idx238 {
    __kind: 'Idx238'
}

export interface LookupSource_Idx24 {
    __kind: 'Idx24'
}

export interface LookupSource_Idx25 {
    __kind: 'Idx25'
}

export interface LookupSource_Idx26 {
    __kind: 'Idx26'
}

export interface LookupSource_Idx27 {
    __kind: 'Idx27'
}

export interface LookupSource_Idx28 {
    __kind: 'Idx28'
}

export interface LookupSource_Idx29 {
    __kind: 'Idx29'
}

export interface LookupSource_Idx3 {
    __kind: 'Idx3'
}

export interface LookupSource_Idx30 {
    __kind: 'Idx30'
}

export interface LookupSource_Idx31 {
    __kind: 'Idx31'
}

export interface LookupSource_Idx32 {
    __kind: 'Idx32'
}

export interface LookupSource_Idx33 {
    __kind: 'Idx33'
}

export interface LookupSource_Idx34 {
    __kind: 'Idx34'
}

export interface LookupSource_Idx35 {
    __kind: 'Idx35'
}

export interface LookupSource_Idx36 {
    __kind: 'Idx36'
}

export interface LookupSource_Idx37 {
    __kind: 'Idx37'
}

export interface LookupSource_Idx38 {
    __kind: 'Idx38'
}

export interface LookupSource_Idx39 {
    __kind: 'Idx39'
}

export interface LookupSource_Idx4 {
    __kind: 'Idx4'
}

export interface LookupSource_Idx40 {
    __kind: 'Idx40'
}

export interface LookupSource_Idx41 {
    __kind: 'Idx41'
}

export interface LookupSource_Idx42 {
    __kind: 'Idx42'
}

export interface LookupSource_Idx43 {
    __kind: 'Idx43'
}

export interface LookupSource_Idx44 {
    __kind: 'Idx44'
}

export interface LookupSource_Idx45 {
    __kind: 'Idx45'
}

export interface LookupSource_Idx46 {
    __kind: 'Idx46'
}

export interface LookupSource_Idx47 {
    __kind: 'Idx47'
}

export interface LookupSource_Idx48 {
    __kind: 'Idx48'
}

export interface LookupSource_Idx49 {
    __kind: 'Idx49'
}

export interface LookupSource_Idx5 {
    __kind: 'Idx5'
}

export interface LookupSource_Idx50 {
    __kind: 'Idx50'
}

export interface LookupSource_Idx51 {
    __kind: 'Idx51'
}

export interface LookupSource_Idx52 {
    __kind: 'Idx52'
}

export interface LookupSource_Idx53 {
    __kind: 'Idx53'
}

export interface LookupSource_Idx54 {
    __kind: 'Idx54'
}

export interface LookupSource_Idx55 {
    __kind: 'Idx55'
}

export interface LookupSource_Idx56 {
    __kind: 'Idx56'
}

export interface LookupSource_Idx57 {
    __kind: 'Idx57'
}

export interface LookupSource_Idx58 {
    __kind: 'Idx58'
}

export interface LookupSource_Idx59 {
    __kind: 'Idx59'
}

export interface LookupSource_Idx6 {
    __kind: 'Idx6'
}

export interface LookupSource_Idx60 {
    __kind: 'Idx60'
}

export interface LookupSource_Idx61 {
    __kind: 'Idx61'
}

export interface LookupSource_Idx62 {
    __kind: 'Idx62'
}

export interface LookupSource_Idx63 {
    __kind: 'Idx63'
}

export interface LookupSource_Idx64 {
    __kind: 'Idx64'
}

export interface LookupSource_Idx65 {
    __kind: 'Idx65'
}

export interface LookupSource_Idx66 {
    __kind: 'Idx66'
}

export interface LookupSource_Idx67 {
    __kind: 'Idx67'
}

export interface LookupSource_Idx68 {
    __kind: 'Idx68'
}

export interface LookupSource_Idx69 {
    __kind: 'Idx69'
}

export interface LookupSource_Idx7 {
    __kind: 'Idx7'
}

export interface LookupSource_Idx70 {
    __kind: 'Idx70'
}

export interface LookupSource_Idx71 {
    __kind: 'Idx71'
}

export interface LookupSource_Idx72 {
    __kind: 'Idx72'
}

export interface LookupSource_Idx73 {
    __kind: 'Idx73'
}

export interface LookupSource_Idx74 {
    __kind: 'Idx74'
}

export interface LookupSource_Idx75 {
    __kind: 'Idx75'
}

export interface LookupSource_Idx76 {
    __kind: 'Idx76'
}

export interface LookupSource_Idx77 {
    __kind: 'Idx77'
}

export interface LookupSource_Idx78 {
    __kind: 'Idx78'
}

export interface LookupSource_Idx79 {
    __kind: 'Idx79'
}

export interface LookupSource_Idx8 {
    __kind: 'Idx8'
}

export interface LookupSource_Idx80 {
    __kind: 'Idx80'
}

export interface LookupSource_Idx81 {
    __kind: 'Idx81'
}

export interface LookupSource_Idx82 {
    __kind: 'Idx82'
}

export interface LookupSource_Idx83 {
    __kind: 'Idx83'
}

export interface LookupSource_Idx84 {
    __kind: 'Idx84'
}

export interface LookupSource_Idx85 {
    __kind: 'Idx85'
}

export interface LookupSource_Idx86 {
    __kind: 'Idx86'
}

export interface LookupSource_Idx87 {
    __kind: 'Idx87'
}

export interface LookupSource_Idx88 {
    __kind: 'Idx88'
}

export interface LookupSource_Idx89 {
    __kind: 'Idx89'
}

export interface LookupSource_Idx9 {
    __kind: 'Idx9'
}

export interface LookupSource_Idx90 {
    __kind: 'Idx90'
}

export interface LookupSource_Idx91 {
    __kind: 'Idx91'
}

export interface LookupSource_Idx92 {
    __kind: 'Idx92'
}

export interface LookupSource_Idx93 {
    __kind: 'Idx93'
}

export interface LookupSource_Idx94 {
    __kind: 'Idx94'
}

export interface LookupSource_Idx95 {
    __kind: 'Idx95'
}

export interface LookupSource_Idx96 {
    __kind: 'Idx96'
}

export interface LookupSource_Idx97 {
    __kind: 'Idx97'
}

export interface LookupSource_Idx98 {
    __kind: 'Idx98'
}

export interface LookupSource_Idx99 {
    __kind: 'Idx99'
}

export interface LookupSource_IdxU16 {
    __kind: 'IdxU16'
    value: number
}

export interface LookupSource_IdxU32 {
    __kind: 'IdxU32'
    value: number
}

export interface LookupSource_IdxU64 {
    __kind: 'IdxU64'
    value: bigint
}

export const LookupSource: sts.Type<LookupSource> = sts.closedEnum(() => {
    return  {
        AccountId: AccountId,
        Idx0: sts.unit(),
        Idx1: sts.unit(),
        Idx10: sts.unit(),
        Idx100: sts.unit(),
        Idx101: sts.unit(),
        Idx102: sts.unit(),
        Idx103: sts.unit(),
        Idx104: sts.unit(),
        Idx105: sts.unit(),
        Idx106: sts.unit(),
        Idx107: sts.unit(),
        Idx108: sts.unit(),
        Idx109: sts.unit(),
        Idx11: sts.unit(),
        Idx110: sts.unit(),
        Idx111: sts.unit(),
        Idx112: sts.unit(),
        Idx113: sts.unit(),
        Idx114: sts.unit(),
        Idx115: sts.unit(),
        Idx116: sts.unit(),
        Idx117: sts.unit(),
        Idx118: sts.unit(),
        Idx119: sts.unit(),
        Idx12: sts.unit(),
        Idx120: sts.unit(),
        Idx121: sts.unit(),
        Idx122: sts.unit(),
        Idx123: sts.unit(),
        Idx124: sts.unit(),
        Idx125: sts.unit(),
        Idx126: sts.unit(),
        Idx127: sts.unit(),
        Idx128: sts.unit(),
        Idx129: sts.unit(),
        Idx13: sts.unit(),
        Idx130: sts.unit(),
        Idx131: sts.unit(),
        Idx132: sts.unit(),
        Idx133: sts.unit(),
        Idx134: sts.unit(),
        Idx135: sts.unit(),
        Idx136: sts.unit(),
        Idx137: sts.unit(),
        Idx138: sts.unit(),
        Idx139: sts.unit(),
        Idx14: sts.unit(),
        Idx140: sts.unit(),
        Idx141: sts.unit(),
        Idx142: sts.unit(),
        Idx143: sts.unit(),
        Idx144: sts.unit(),
        Idx145: sts.unit(),
        Idx146: sts.unit(),
        Idx147: sts.unit(),
        Idx148: sts.unit(),
        Idx149: sts.unit(),
        Idx15: sts.unit(),
        Idx150: sts.unit(),
        Idx151: sts.unit(),
        Idx152: sts.unit(),
        Idx153: sts.unit(),
        Idx154: sts.unit(),
        Idx155: sts.unit(),
        Idx156: sts.unit(),
        Idx157: sts.unit(),
        Idx158: sts.unit(),
        Idx159: sts.unit(),
        Idx16: sts.unit(),
        Idx160: sts.unit(),
        Idx161: sts.unit(),
        Idx162: sts.unit(),
        Idx163: sts.unit(),
        Idx164: sts.unit(),
        Idx165: sts.unit(),
        Idx166: sts.unit(),
        Idx167: sts.unit(),
        Idx168: sts.unit(),
        Idx169: sts.unit(),
        Idx17: sts.unit(),
        Idx170: sts.unit(),
        Idx171: sts.unit(),
        Idx172: sts.unit(),
        Idx173: sts.unit(),
        Idx174: sts.unit(),
        Idx175: sts.unit(),
        Idx176: sts.unit(),
        Idx177: sts.unit(),
        Idx178: sts.unit(),
        Idx179: sts.unit(),
        Idx18: sts.unit(),
        Idx180: sts.unit(),
        Idx181: sts.unit(),
        Idx182: sts.unit(),
        Idx183: sts.unit(),
        Idx184: sts.unit(),
        Idx185: sts.unit(),
        Idx186: sts.unit(),
        Idx187: sts.unit(),
        Idx188: sts.unit(),
        Idx189: sts.unit(),
        Idx19: sts.unit(),
        Idx190: sts.unit(),
        Idx191: sts.unit(),
        Idx192: sts.unit(),
        Idx193: sts.unit(),
        Idx194: sts.unit(),
        Idx195: sts.unit(),
        Idx196: sts.unit(),
        Idx197: sts.unit(),
        Idx198: sts.unit(),
        Idx199: sts.unit(),
        Idx2: sts.unit(),
        Idx20: sts.unit(),
        Idx200: sts.unit(),
        Idx201: sts.unit(),
        Idx202: sts.unit(),
        Idx203: sts.unit(),
        Idx204: sts.unit(),
        Idx205: sts.unit(),
        Idx206: sts.unit(),
        Idx207: sts.unit(),
        Idx208: sts.unit(),
        Idx209: sts.unit(),
        Idx21: sts.unit(),
        Idx210: sts.unit(),
        Idx211: sts.unit(),
        Idx212: sts.unit(),
        Idx213: sts.unit(),
        Idx214: sts.unit(),
        Idx215: sts.unit(),
        Idx216: sts.unit(),
        Idx217: sts.unit(),
        Idx218: sts.unit(),
        Idx219: sts.unit(),
        Idx22: sts.unit(),
        Idx220: sts.unit(),
        Idx221: sts.unit(),
        Idx222: sts.unit(),
        Idx223: sts.unit(),
        Idx224: sts.unit(),
        Idx225: sts.unit(),
        Idx226: sts.unit(),
        Idx227: sts.unit(),
        Idx228: sts.unit(),
        Idx229: sts.unit(),
        Idx23: sts.unit(),
        Idx230: sts.unit(),
        Idx231: sts.unit(),
        Idx232: sts.unit(),
        Idx233: sts.unit(),
        Idx234: sts.unit(),
        Idx235: sts.unit(),
        Idx236: sts.unit(),
        Idx237: sts.unit(),
        Idx238: sts.unit(),
        Idx24: sts.unit(),
        Idx25: sts.unit(),
        Idx26: sts.unit(),
        Idx27: sts.unit(),
        Idx28: sts.unit(),
        Idx29: sts.unit(),
        Idx3: sts.unit(),
        Idx30: sts.unit(),
        Idx31: sts.unit(),
        Idx32: sts.unit(),
        Idx33: sts.unit(),
        Idx34: sts.unit(),
        Idx35: sts.unit(),
        Idx36: sts.unit(),
        Idx37: sts.unit(),
        Idx38: sts.unit(),
        Idx39: sts.unit(),
        Idx4: sts.unit(),
        Idx40: sts.unit(),
        Idx41: sts.unit(),
        Idx42: sts.unit(),
        Idx43: sts.unit(),
        Idx44: sts.unit(),
        Idx45: sts.unit(),
        Idx46: sts.unit(),
        Idx47: sts.unit(),
        Idx48: sts.unit(),
        Idx49: sts.unit(),
        Idx5: sts.unit(),
        Idx50: sts.unit(),
        Idx51: sts.unit(),
        Idx52: sts.unit(),
        Idx53: sts.unit(),
        Idx54: sts.unit(),
        Idx55: sts.unit(),
        Idx56: sts.unit(),
        Idx57: sts.unit(),
        Idx58: sts.unit(),
        Idx59: sts.unit(),
        Idx6: sts.unit(),
        Idx60: sts.unit(),
        Idx61: sts.unit(),
        Idx62: sts.unit(),
        Idx63: sts.unit(),
        Idx64: sts.unit(),
        Idx65: sts.unit(),
        Idx66: sts.unit(),
        Idx67: sts.unit(),
        Idx68: sts.unit(),
        Idx69: sts.unit(),
        Idx7: sts.unit(),
        Idx70: sts.unit(),
        Idx71: sts.unit(),
        Idx72: sts.unit(),
        Idx73: sts.unit(),
        Idx74: sts.unit(),
        Idx75: sts.unit(),
        Idx76: sts.unit(),
        Idx77: sts.unit(),
        Idx78: sts.unit(),
        Idx79: sts.unit(),
        Idx8: sts.unit(),
        Idx80: sts.unit(),
        Idx81: sts.unit(),
        Idx82: sts.unit(),
        Idx83: sts.unit(),
        Idx84: sts.unit(),
        Idx85: sts.unit(),
        Idx86: sts.unit(),
        Idx87: sts.unit(),
        Idx88: sts.unit(),
        Idx89: sts.unit(),
        Idx9: sts.unit(),
        Idx90: sts.unit(),
        Idx91: sts.unit(),
        Idx92: sts.unit(),
        Idx93: sts.unit(),
        Idx94: sts.unit(),
        Idx95: sts.unit(),
        Idx96: sts.unit(),
        Idx97: sts.unit(),
        Idx98: sts.unit(),
        Idx99: sts.unit(),
        IdxU16: sts.number(),
        IdxU32: sts.number(),
        IdxU64: sts.bigint(),
    }
})

export type AccountId = Bytes

export const AccountId: sts.Type<AccountId> = sts.bytes()

export type TimestampCall = TimestampCall_set

/**
 *  Set the current time.
 * 
 *  This call should be invoked exactly once per block. It will panic at the finalization
 *  phase, if this call hasn't been invoked by that time.
 * 
 *  The timestamp should be greater than the previous one by the amount specified by
 *  `MinimumPeriod`.
 * 
 *  The dispatch origin for this call must be `Inherent`.
 */
export interface TimestampCall_set {
    __kind: 'set'
    now: bigint,
}

export const TimestampCall: sts.Type<TimestampCall> = sts.closedEnum(() => {
    return  {
        set: sts.enumStruct({
            now: sts.bigint(),
        }),
    }
})

export type TechnicalMembershipCall = TechnicalMembershipCall_add_member | TechnicalMembershipCall_remove_member | TechnicalMembershipCall_reset_members | TechnicalMembershipCall_swap_member

/**
 *  Add a member `who` to the set.
 * 
 *  May only be called from `AddOrigin` or root.
 */
export interface TechnicalMembershipCall_add_member {
    __kind: 'add_member'
    who: AccountId,
}

/**
 *  Remove a member `who` from the set.
 * 
 *  May only be called from `RemoveOrigin` or root.
 */
export interface TechnicalMembershipCall_remove_member {
    __kind: 'remove_member'
    who: AccountId,
}

/**
 *  Change the membership to a new set, disregarding the existing membership. Be nice and
 *  pass `members` pre-sorted.
 * 
 *  May only be called from `ResetOrigin` or root.
 */
export interface TechnicalMembershipCall_reset_members {
    __kind: 'reset_members'
    members: AccountId[],
}

/**
 *  Swap out one member `remove` for another `add`.
 * 
 *  May only be called from `SwapOrigin` or root.
 */
export interface TechnicalMembershipCall_swap_member {
    __kind: 'swap_member'
    remove: AccountId,
    add: AccountId,
}

export const TechnicalMembershipCall: sts.Type<TechnicalMembershipCall> = sts.closedEnum(() => {
    return  {
        add_member: sts.enumStruct({
            who: AccountId,
        }),
        remove_member: sts.enumStruct({
            who: AccountId,
        }),
        reset_members: sts.enumStruct({
            members: sts.array(() => AccountId),
        }),
        swap_member: sts.enumStruct({
            remove: AccountId,
            add: AccountId,
        }),
    }
})

export type TechnicalCommitteeCall = TechnicalCommitteeCall_execute | TechnicalCommitteeCall_propose | TechnicalCommitteeCall_set_members | TechnicalCommitteeCall_vote

/**
 *  Dispatch a proposal from a member using the `Member` origin.
 * 
 *  Origin must be a member of the collective.
 */
export interface TechnicalCommitteeCall_execute {
    __kind: 'execute'
    proposal: Proposal,
}

/**
 *  # <weight>
 *  - Bounded storage reads and writes.
 *  - Argument `threshold` has bearing on weight.
 *  # </weight>
 */
export interface TechnicalCommitteeCall_propose {
    __kind: 'propose'
    threshold: number,
    proposal: Proposal,
}

/**
 *  Set the collective's membership manually to `new_members`. Be nice to the chain and
 *  provide it pre-sorted.
 * 
 *  Requires root origin.
 */
export interface TechnicalCommitteeCall_set_members {
    __kind: 'set_members'
    newMembers: AccountId[],
}

/**
 *  # <weight>
 *  - Bounded storage read and writes.
 *  - Will be slightly heavier if the proposal is approved / disapproved after the vote.
 *  # </weight>
 */
export interface TechnicalCommitteeCall_vote {
    __kind: 'vote'
    proposal: Hash,
    index: number,
    approve: boolean,
}

export const TechnicalCommitteeCall: sts.Type<TechnicalCommitteeCall> = sts.closedEnum(() => {
    return  {
        execute: sts.enumStruct({
            proposal: Proposal,
        }),
        propose: sts.enumStruct({
            threshold: sts.number(),
            proposal: Proposal,
        }),
        set_members: sts.enumStruct({
            newMembers: sts.array(() => AccountId),
        }),
        vote: sts.enumStruct({
            proposal: Hash,
            index: sts.number(),
            approve: sts.boolean(),
        }),
    }
})

export type Hash = Bytes

export const Hash: sts.Type<Hash> = sts.bytes()

export type SystemCall = SystemCall_fill_block | SystemCall_kill_prefix | SystemCall_kill_storage | SystemCall_remark | SystemCall_set_code | SystemCall_set_heap_pages | SystemCall_set_storage

/**
 *  A big dispatch that will disallow any other transaction to be included.
 */
export interface SystemCall_fill_block {
    __kind: 'fill_block'
}

/**
 *  Kill all storage items with a key that starts with the given prefix.
 */
export interface SystemCall_kill_prefix {
    __kind: 'kill_prefix'
    prefix: Key,
}

/**
 *  Kill some items from storage.
 */
export interface SystemCall_kill_storage {
    __kind: 'kill_storage'
    keys: Key[],
}

/**
 *  Make some on-chain remark.
 */
export interface SystemCall_remark {
    __kind: 'remark'
    remark: Bytes,
}

/**
 *  Set the new code.
 */
export interface SystemCall_set_code {
    __kind: 'set_code'
    new: Bytes,
}

/**
 *  Set the number of pages in the WebAssembly environment's heap.
 */
export interface SystemCall_set_heap_pages {
    __kind: 'set_heap_pages'
    pages: bigint,
}

/**
 *  Set some items of storage.
 */
export interface SystemCall_set_storage {
    __kind: 'set_storage'
    items: KeyValue[],
}

export const SystemCall: sts.Type<SystemCall> = sts.closedEnum(() => {
    return  {
        fill_block: sts.unit(),
        kill_prefix: sts.enumStruct({
            prefix: Key,
        }),
        kill_storage: sts.enumStruct({
            keys: sts.array(() => Key),
        }),
        remark: sts.enumStruct({
            remark: sts.bytes(),
        }),
        set_code: sts.enumStruct({
            new: sts.bytes(),
        }),
        set_heap_pages: sts.enumStruct({
            pages: sts.bigint(),
        }),
        set_storage: sts.enumStruct({
            items: sts.array(() => KeyValue),
        }),
    }
})

export type KeyValue = [StorageKey, StorageData]

export const KeyValue: sts.Type<KeyValue> = sts.tuple(() => StorageKey, StorageData)

export type StorageData = Bytes

export const StorageData: sts.Type<StorageData> = sts.bytes()

export type StorageKey = Bytes

export const StorageKey: sts.Type<StorageKey> = sts.bytes()

export type Key = Bytes

export const Key: sts.Type<Key> = sts.bytes()

export type StakingCall = StakingCall_bond | StakingCall_bond_extra | StakingCall_cancel_deferred_slash | StakingCall_chill | StakingCall_force_new_era | StakingCall_force_new_era_always | StakingCall_force_no_eras | StakingCall_force_unstake | StakingCall_nominate | StakingCall_set_controller | StakingCall_set_invulnerables | StakingCall_set_payee | StakingCall_set_validator_count | StakingCall_unbond | StakingCall_validate | StakingCall_withdraw_unbonded

/**
 *  Take the origin account as a stash and lock up `value` of its balance. `controller` will
 *  be the account that controls it.
 * 
 *  `value` must be more than the `minimum_balance` specified by `T::Currency`.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash account.
 * 
 *  # <weight>
 *  - Independent of the arguments. Moderate complexity.
 *  - O(1).
 *  - Three extra DB entries.
 * 
 *  NOTE: Two of the storage writes (`Self::bonded`, `Self::payee`) are _never_ cleaned unless
 *  the `origin` falls below _existential deposit_ and gets removed as dust.
 *  # </weight>
 */
export interface StakingCall_bond {
    __kind: 'bond'
    controller: LookupSource,
    value: bigint,
    payee: RewardDestination,
}

/**
 *  Add some extra amount that have appeared in the stash `free_balance` into the balance up
 *  for staking.
 * 
 *  Use this if there are additional funds in your stash account that you wish to bond.
 *  Unlike [`bond`] or [`unbond`] this function does not impose any limitation on the amount
 *  that can be added.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash, not the controller.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - O(1).
 *  - One DB entry.
 *  # </weight>
 */
export interface StakingCall_bond_extra {
    __kind: 'bond_extra'
    maxAdditional: bigint,
}

/**
 *  Cancel enactment of a deferred slash. Can be called by either the root origin or
 *  the `T::SlashCancelOrigin`.
 *  passing the era and indices of the slashes for that era to kill.
 * 
 *  # <weight>
 *  - One storage write.
 *  # </weight>
 */
export interface StakingCall_cancel_deferred_slash {
    __kind: 'cancel_deferred_slash'
    era: EraIndex,
    slashIndices: number[],
}

/**
 *  Declare no desire to either validate or nominate.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains one read.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export interface StakingCall_chill {
    __kind: 'chill'
}

/**
 *  Force there to be a new era at the end of the next session. After this, it will be
 *  reset to normal (non-forced) behaviour.
 * 
 *  # <weight>
 *  - No arguments.
 *  # </weight>
 */
export interface StakingCall_force_new_era {
    __kind: 'force_new_era'
}

/**
 *  Force there to be a new era at the end of sessions indefinitely.
 * 
 *  # <weight>
 *  - One storage write
 *  # </weight>
 */
export interface StakingCall_force_new_era_always {
    __kind: 'force_new_era_always'
}

/**
 *  Force there to be no new eras indefinitely.
 * 
 *  # <weight>
 *  - No arguments.
 *  # </weight>
 */
export interface StakingCall_force_no_eras {
    __kind: 'force_no_eras'
}

/**
 *  Force a current staker to become completely unstaked, immediately.
 */
export interface StakingCall_force_unstake {
    __kind: 'force_unstake'
    stash: AccountId,
}

/**
 *  Declare the desire to nominate `targets` for the origin controller.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  # <weight>
 *  - The transaction's complexity is proportional to the size of `targets`,
 *  which is capped at `MAX_NOMINATIONS`.
 *  - Both the reads and writes follow a similar pattern.
 *  # </weight>
 */
export interface StakingCall_nominate {
    __kind: 'nominate'
    targets: LookupSource[],
}

/**
 *  (Re-)set the controller of a stash.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash, not the controller.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export interface StakingCall_set_controller {
    __kind: 'set_controller'
    controller: LookupSource,
}

/**
 *  Set the validators who cannot be slashed (if any).
 */
export interface StakingCall_set_invulnerables {
    __kind: 'set_invulnerables'
    validators: AccountId[],
}

/**
 *  (Re-)set the payment target for a controller.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export interface StakingCall_set_payee {
    __kind: 'set_payee'
    payee: RewardDestination,
}

/**
 *  The ideal number of validators.
 */
export interface StakingCall_set_validator_count {
    __kind: 'set_validator_count'
    new: number,
}

/**
 *  Schedule a portion of the stash to be unlocked ready for transfer out after the bond
 *  period ends. If this leaves an amount actively bonded less than
 *  T::Currency::minimum_balance(), then it is increased to the full amount.
 * 
 *  Once the unlock period is done, you can call `withdraw_unbonded` to actually move
 *  the funds out of management ready for transfer.
 * 
 *  No more than a limited number of unlocking chunks (see `MAX_UNLOCKING_CHUNKS`)
 *  can co-exists at the same time. In that case, [`Call::withdraw_unbonded`] need
 *  to be called first to remove some of the chunks (if possible).
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  See also [`Call::withdraw_unbonded`].
 * 
 *  # <weight>
 *  - Independent of the arguments. Limited but potentially exploitable complexity.
 *  - Contains a limited number of reads.
 *  - Each call (requires the remainder of the bonded balance to be above `minimum_balance`)
 *    will cause a new entry to be inserted into a vector (`Ledger.unlocking`) kept in storage.
 *    The only way to clean the aforementioned storage item is also user-controlled via `withdraw_unbonded`.
 *  - One DB entry.
 *  </weight>
 */
export interface StakingCall_unbond {
    __kind: 'unbond'
    value: bigint,
}

/**
 *  Declare the desire to validate for the origin controller.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export interface StakingCall_validate {
    __kind: 'validate'
    prefs: ValidatorPrefs,
}

/**
 *  Remove any unlocked chunks from the `unlocking` queue from our management.
 * 
 *  This essentially frees up that balance to be used by the stash account to do
 *  whatever it wants.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  See also [`Call::unbond`].
 * 
 *  # <weight>
 *  - Could be dependent on the `origin` argument and how much `unlocking` chunks exist.
 *   It implies `consolidate_unlocked` which loops over `Ledger.unlocking`, which is
 *   indirectly user-controlled. See [`unbond`] for more detail.
 *  - Contains a limited number of reads, yet the size of which could be large based on `ledger`.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export interface StakingCall_withdraw_unbonded {
    __kind: 'withdraw_unbonded'
}

export const StakingCall: sts.Type<StakingCall> = sts.closedEnum(() => {
    return  {
        bond: sts.enumStruct({
            controller: LookupSource,
            value: sts.bigint(),
            payee: RewardDestination,
        }),
        bond_extra: sts.enumStruct({
            maxAdditional: sts.bigint(),
        }),
        cancel_deferred_slash: sts.enumStruct({
            era: EraIndex,
            slashIndices: sts.array(() => sts.number()),
        }),
        chill: sts.unit(),
        force_new_era: sts.unit(),
        force_new_era_always: sts.unit(),
        force_no_eras: sts.unit(),
        force_unstake: sts.enumStruct({
            stash: AccountId,
        }),
        nominate: sts.enumStruct({
            targets: sts.array(() => LookupSource),
        }),
        set_controller: sts.enumStruct({
            controller: LookupSource,
        }),
        set_invulnerables: sts.enumStruct({
            validators: sts.array(() => AccountId),
        }),
        set_payee: sts.enumStruct({
            payee: RewardDestination,
        }),
        set_validator_count: sts.enumStruct({
            new: sts.number(),
        }),
        unbond: sts.enumStruct({
            value: sts.bigint(),
        }),
        validate: sts.enumStruct({
            prefs: ValidatorPrefs,
        }),
        withdraw_unbonded: sts.unit(),
    }
})

export type ValidatorPrefs = {
    commission: number,
}

export const ValidatorPrefs: sts.Type<ValidatorPrefs> = sts.struct(() => {
    return  {
        commission: sts.number(),
    }
})

export type EraIndex = number

export const EraIndex: sts.Type<EraIndex> = sts.number()

export type RewardDestination = RewardDestination_Account | RewardDestination_Controller | RewardDestination_None | RewardDestination_Staked | RewardDestination_Stash

export interface RewardDestination_Account {
    __kind: 'Account'
    value: AccountId
}

export interface RewardDestination_Controller {
    __kind: 'Controller'
}

export interface RewardDestination_None {
    __kind: 'None'
}

export interface RewardDestination_Staked {
    __kind: 'Staked'
}

export interface RewardDestination_Stash {
    __kind: 'Stash'
}

export const RewardDestination: sts.Type<RewardDestination> = sts.closedEnum(() => {
    return  {
        Account: AccountId,
        Controller: sts.unit(),
        None: sts.unit(),
        Staked: sts.unit(),
        Stash: sts.unit(),
    }
})

export type SlotsCall = SlotsCall_bid | SlotsCall_bid_renew | SlotsCall_elaborate_deploy_data | SlotsCall_fix_deploy_data | SlotsCall_new_auction | SlotsCall_set_offboarding

/**
 *  Make a new bid from an account (including a parachain account) for deploying a new
 *  parachain.
 * 
 *  Multiple simultaneous bids from the same bidder are allowed only as long as all active
 *  bids overlap each other (i.e. are mutually exclusive). Bids cannot be redacted.
 * 
 *  - `sub` is the sub-bidder ID, allowing for multiple competing bids to be made by (and
 *  funded by) the same account.
 *  - `auction_index` is the index of the auction to bid on. Should just be the present
 *  value of `AuctionCounter`.
 *  - `first_slot` is the first lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `last_slot` is the last lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `amount` is the amount to bid to be held as deposit for the parachain should the
 *  bid win. This amount is held throughout the range.
 */
export interface SlotsCall_bid {
    __kind: 'bid'
    sub: number,
    auctionIndex: number,
    firstSlot: number,
    lastSlot: number,
    amount: bigint,
}

/**
 *  Make a new bid from a parachain account for renewing that (pre-existing) parachain.
 * 
 *  The origin *must* be a parachain account.
 * 
 *  Multiple simultaneous bids from the same bidder are allowed only as long as all active
 *  bids overlap each other (i.e. are mutually exclusive). Bids cannot be redacted.
 * 
 *  - `auction_index` is the index of the auction to bid on. Should just be the present
 *  value of `AuctionCounter`.
 *  - `first_slot` is the first lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `last_slot` is the last lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `amount` is the amount to bid to be held as deposit for the parachain should the
 *  bid win. This amount is held throughout the range.
 */
export interface SlotsCall_bid_renew {
    __kind: 'bid_renew'
    auctionIndex: number,
    firstSlot: number,
    lastSlot: number,
    amount: bigint,
}

/**
 *  Note a new parachain's code.
 * 
 *  This must be called after `fix_deploy_data` and `code` must be the preimage of the
 *  `code_hash` passed there for the same `para_id`.
 * 
 *  This may be called before or after the beginning of the parachain's first lease period.
 *  If called before then the parachain will become active at the first block of its
 *  starting lease period. If after, then it will become active immediately after this call.
 * 
 *  - `_origin` is irrelevant.
 *  - `para_id` is the parachain ID whose code will be elaborated.
 *  - `code` is the preimage of the registered `code_hash` of `para_id`.
 */
export interface SlotsCall_elaborate_deploy_data {
    __kind: 'elaborate_deploy_data'
    paraId: number,
    code: Bytes,
}

/**
 *  Set the deploy information for a successful bid to deploy a new parachain.
 * 
 *  - `origin` must be the successful bidder account.
 *  - `sub` is the sub-bidder ID of the bidder.
 *  - `para_id` is the parachain ID allotted to the winning bidder.
 *  - `code_hash` is the hash of the parachain's Wasm validation function.
 *  - `initial_head_data` is the parachain's initial head data.
 */
export interface SlotsCall_fix_deploy_data {
    __kind: 'fix_deploy_data'
    sub: number,
    paraId: number,
    codeHash: Hash,
    initialHeadData: Bytes,
}

/**
 *  Create a new auction.
 * 
 *  This can only happen when there isn't already an auction in progress and may only be
 *  called by the root origin. Accepts the `duration` of this auction and the
 *  `lease_period_index` of the initial lease period of the four that are to be auctioned.
 */
export interface SlotsCall_new_auction {
    __kind: 'new_auction'
    duration: number,
    leasePeriodIndex: number,
}

/**
 *  Set the off-boarding information for a parachain.
 * 
 *  The origin *must* be a parachain account.
 * 
 *  - `dest` is the destination account to receive the parachain's deposit.
 */
export interface SlotsCall_set_offboarding {
    __kind: 'set_offboarding'
    dest: LookupSource,
}

export const SlotsCall: sts.Type<SlotsCall> = sts.closedEnum(() => {
    return  {
        bid: sts.enumStruct({
            sub: sts.number(),
            auctionIndex: sts.number(),
            firstSlot: sts.number(),
            lastSlot: sts.number(),
            amount: sts.bigint(),
        }),
        bid_renew: sts.enumStruct({
            auctionIndex: sts.number(),
            firstSlot: sts.number(),
            lastSlot: sts.number(),
            amount: sts.bigint(),
        }),
        elaborate_deploy_data: sts.enumStruct({
            paraId: sts.number(),
            code: sts.bytes(),
        }),
        fix_deploy_data: sts.enumStruct({
            sub: sts.number(),
            paraId: sts.number(),
            codeHash: Hash,
            initialHeadData: sts.bytes(),
        }),
        new_auction: sts.enumStruct({
            duration: sts.number(),
            leasePeriodIndex: sts.number(),
        }),
        set_offboarding: sts.enumStruct({
            dest: LookupSource,
        }),
    }
})

export type SessionCall = SessionCall_set_keys

/**
 *  Sets the session key(s) of the function caller to `key`.
 *  Allows an account to set its session key prior to becoming a validator.
 *  This doesn't take effect until the next session.
 * 
 *  The dispatch origin of this function must be signed.
 * 
 *  # <weight>
 *  - O(log n) in number of accounts.
 *  - One extra DB entry.
 *  # </weight>
 */
export interface SessionCall_set_keys {
    __kind: 'set_keys'
    keys: Keys,
    proof: Bytes,
}

export const SessionCall: sts.Type<SessionCall> = sts.closedEnum(() => {
    return  {
        set_keys: sts.enumStruct({
            keys: Keys,
            proof: sts.bytes(),
        }),
    }
})

export type Keys = [AccountId, AccountId, AccountId, AccountId, AccountId]

export const Keys: sts.Type<Keys> = sts.tuple(() => AccountId, AccountId, AccountId, AccountId, AccountId)

export type RegistrarCall = RegistrarCall_deregister_para | RegistrarCall_deregister_parathread | RegistrarCall_register_para | RegistrarCall_register_parathread | RegistrarCall_select_parathread | RegistrarCall_set_thread_count | RegistrarCall_swap

/**
 *  Deregister a parachain with given id
 */
export interface RegistrarCall_deregister_para {
    __kind: 'deregister_para'
    id: number,
}

/**
 *  Deregister a parathread and retrieve the deposit.
 * 
 *  Must be sent from a `Parachain` origin which is currently a parathread.
 * 
 *  Ensure that before calling this that any funds you want emptied from the parathread's
 *  account is moved out; after this it will be impossible to retrieve them (without
 *  governance intervention).
 */
export interface RegistrarCall_deregister_parathread {
    __kind: 'deregister_parathread'
}

/**
 *  Register a parachain with given code.
 *  Fails if given ID is already used.
 */
export interface RegistrarCall_register_para {
    __kind: 'register_para'
    id: number,
    info: ParaInfo,
    code: Bytes,
    initialHeadData: Bytes,
}

/**
 *  Register a parathread for immediate use.
 * 
 *  Must be sent from a Signed origin that is able to have ParathreadDeposit reserved.
 *  `code` and `initial_head_data` are used to initialize the parathread's state.
 */
export interface RegistrarCall_register_parathread {
    __kind: 'register_parathread'
    code: Bytes,
    initialHeadData: Bytes,
}

/**
 *  Place a bid for a parathread to be progressed in the next block.
 * 
 *  This is a kind of special transaction that should by heavily prioritized in the
 *  transaction pool according to the `value`; only `ThreadCount` of them may be presented
 *  in any single block.
 */
export interface RegistrarCall_select_parathread {
    __kind: 'select_parathread'
    id: number,
    collator: CollatorId,
    headHash: Hash,
}

/**
 *  Reset the number of parathreads that can pay to be scheduled in a single block.
 * 
 *  - `count`: The number of parathreads.
 * 
 *  Must be called from Root origin.
 */
export interface RegistrarCall_set_thread_count {
    __kind: 'set_thread_count'
    count: number,
}

/**
 *  Swap a parachain with another parachain or parathread. The origin must be a `Parachain`.
 *  The swap will happen only if there is already an opposite swap pending. If there is not,
 *  the swap will be stored in the pending swaps map, ready for a later confirmatory swap.
 * 
 *  The `ParaId`s remain mapped to the same head data and code so external code can rely on
 *  `ParaId` to be a long-term identifier of a notional "parachain". However, their
 *  scheduling info (i.e. whether they're a parathread or parachain), auction information
 *  and the auction deposit are switched.
 */
export interface RegistrarCall_swap {
    __kind: 'swap'
    other: number,
}

export const RegistrarCall: sts.Type<RegistrarCall> = sts.closedEnum(() => {
    return  {
        deregister_para: sts.enumStruct({
            id: sts.number(),
        }),
        deregister_parathread: sts.unit(),
        register_para: sts.enumStruct({
            id: sts.number(),
            info: ParaInfo,
            code: sts.bytes(),
            initialHeadData: sts.bytes(),
        }),
        register_parathread: sts.enumStruct({
            code: sts.bytes(),
            initialHeadData: sts.bytes(),
        }),
        select_parathread: sts.enumStruct({
            id: sts.number(),
            collator: CollatorId,
            headHash: Hash,
        }),
        set_thread_count: sts.enumStruct({
            count: sts.number(),
        }),
        swap: sts.enumStruct({
            other: sts.number(),
        }),
    }
})

export type CollatorId = Bytes

export const CollatorId: sts.Type<CollatorId> = sts.bytes()

export type ParaInfo = {
    manager: AccountId,
    deposit: Balance,
    locked: boolean,
}

export const ParaInfo: sts.Type<ParaInfo> = sts.struct(() => {
    return  {
        manager: AccountId,
        deposit: Balance,
        locked: sts.boolean(),
    }
})

export type Balance = bigint

export const Balance: sts.Type<Balance> = sts.bigint()

export type ParachainsCall = ParachainsCall_set_heads

/**
 *  Provide candidate receipts for parachains, in ascending order by id.
 */
export interface ParachainsCall_set_heads {
    __kind: 'set_heads'
    heads: AttestedCandidate[],
}

export const ParachainsCall: sts.Type<ParachainsCall> = sts.closedEnum(() => {
    return  {
        set_heads: sts.enumStruct({
            heads: sts.array(() => AttestedCandidate),
        }),
    }
})

export type AttestedCandidate = {
    candidate: AbridgedCandidateReceipt,
    validityVotes: ValidityAttestation[],
    validatorIndices: Uint8Array,
}

export const AttestedCandidate: sts.Type<AttestedCandidate> = sts.struct(() => {
    return  {
        candidate: AbridgedCandidateReceipt,
        validityVotes: sts.array(() => ValidityAttestation),
        validatorIndices: sts.uint8array(),
    }
})

export type ValidityAttestation = ValidityAttestation_Explicit | ValidityAttestation_Implicit | ValidityAttestation_Never

export interface ValidityAttestation_Explicit {
    __kind: 'Explicit'
    value: ValidatorSignature
}

export interface ValidityAttestation_Implicit {
    __kind: 'Implicit'
    value: ValidatorSignature
}

export interface ValidityAttestation_Never {
    __kind: 'Never'
}

export const ValidityAttestation: sts.Type<ValidityAttestation> = sts.closedEnum(() => {
    return  {
        Explicit: ValidatorSignature,
        Implicit: ValidatorSignature,
        Never: sts.unit(),
    }
})

export type ValidatorSignature = Bytes

export const ValidatorSignature: sts.Type<ValidatorSignature> = sts.bytes()

export type AbridgedCandidateReceipt = {
    parachainIndex: ParaId,
    relayParent: Hash,
    headData: HeadData,
    collator: CollatorId,
    signature: CollatorSignature,
    povBlockHash: Hash,
    commitments: CandidateCommitments,
}

export const AbridgedCandidateReceipt: sts.Type<AbridgedCandidateReceipt> = sts.struct(() => {
    return  {
        parachainIndex: ParaId,
        relayParent: Hash,
        headData: HeadData,
        collator: CollatorId,
        signature: CollatorSignature,
        povBlockHash: Hash,
        commitments: CandidateCommitments,
    }
})

export type CandidateCommitments = {
    upwardMessages: UpwardMessage[],
    horizontalMessages: OutboundHrmpMessage[],
    newValidationCode?: (ValidationCode | undefined),
    headData: HeadData,
    processedDownwardMessages: number,
    hrmpWatermark: BlockNumber,
}

export const CandidateCommitments: sts.Type<CandidateCommitments> = sts.struct(() => {
    return  {
        upwardMessages: sts.array(() => UpwardMessage),
        horizontalMessages: sts.array(() => OutboundHrmpMessage),
        newValidationCode: sts.option(() => ValidationCode),
        headData: HeadData,
        processedDownwardMessages: sts.number(),
        hrmpWatermark: BlockNumber,
    }
})

export type BlockNumber = number

export const BlockNumber: sts.Type<BlockNumber> = sts.number()

export type ValidationCode = Bytes

export const ValidationCode: sts.Type<ValidationCode> = sts.bytes()

export type OutboundHrmpMessage = {
    recipient: number,
    data: Bytes,
}

export const OutboundHrmpMessage: sts.Type<OutboundHrmpMessage> = sts.struct(() => {
    return  {
        recipient: sts.number(),
        data: sts.bytes(),
    }
})

export type UpwardMessage = Bytes

export const UpwardMessage: sts.Type<UpwardMessage> = sts.bytes()

export type CollatorSignature = Bytes

export const CollatorSignature: sts.Type<CollatorSignature> = sts.bytes()

export type HeadData = Bytes

export const HeadData: sts.Type<HeadData> = sts.bytes()

export type ParaId = number

export const ParaId: sts.Type<ParaId> = sts.number()

export type OffencesCall = never

export type NicksCall = NicksCall_clear_name | NicksCall_force_name | NicksCall_kill_name | NicksCall_set_name

/**
 *  Clear an account's name and return the deposit. Fails if the account was not named.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - O(1).
 *  - One balance operation.
 *  - One storage read/write.
 *  - One event.
 *  # </weight>
 */
export interface NicksCall_clear_name {
    __kind: 'clear_name'
}

/**
 *  Set a third-party account's name with no deposit.
 * 
 *  No length checking is done on the name.
 * 
 *  The dispatch origin for this call must be _Root_ or match `T::ForceOrigin`.
 * 
 *  # <weight>
 *  - O(1).
 *  - At most one balance operation.
 *  - One storage read/write.
 *  - One event.
 *  # </weight>
 */
export interface NicksCall_force_name {
    __kind: 'force_name'
    target: LookupSource,
    name: Bytes,
}

/**
 *  Remove an account's name and take charge of the deposit.
 * 
 *  Fails if `who` has not been named. The deposit is dealt with through `T::Slashed`
 *  imbalance handler.
 * 
 *  The dispatch origin for this call must be _Root_ or match `T::ForceOrigin`.
 * 
 *  # <weight>
 *  - O(1).
 *  - One unbalanced handler (probably a balance transfer)
 *  - One storage read/write.
 *  - One event.
 *  # </weight>
 */
export interface NicksCall_kill_name {
    __kind: 'kill_name'
    target: LookupSource,
}

/**
 *  Set an account's name. The name should be a UTF-8-encoded string by convention, though
 *  we don't check it.
 * 
 *  The name may not be more than `T::MaxLength` bytes, nor less than `T::MinLength` bytes.
 * 
 *  If the account doesn't already have a name, then a fee of `ReservationFee` is reserved
 *  in the account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - O(1).
 *  - At most one balance operation.
 *  - One storage read/write.
 *  - One event.
 *  # </weight>
 */
export interface NicksCall_set_name {
    __kind: 'set_name'
    name: Bytes,
}

export const NicksCall: sts.Type<NicksCall> = sts.closedEnum(() => {
    return  {
        clear_name: sts.unit(),
        force_name: sts.enumStruct({
            target: LookupSource,
            name: sts.bytes(),
        }),
        kill_name: sts.enumStruct({
            target: LookupSource,
        }),
        set_name: sts.enumStruct({
            name: sts.bytes(),
        }),
    }
})

export type IndicesCall = never

export type ImOnlineCall = ImOnlineCall_heartbeat

export interface ImOnlineCall_heartbeat {
    __kind: 'heartbeat'
    heartbeat: Heartbeat,
    signature: Signature,
}

export const ImOnlineCall: sts.Type<ImOnlineCall> = sts.closedEnum(() => {
    return  {
        heartbeat: sts.enumStruct({
            heartbeat: Heartbeat,
            signature: Signature,
        }),
    }
})

export type Signature = Bytes

export const Signature: sts.Type<Signature> = sts.bytes()

export type Heartbeat = {
    blockNumber: BlockNumber,
    networkState: OpaqueNetworkState,
    sessionIndex: SessionIndex,
    authorityIndex: AuthIndex,
}

export const Heartbeat: sts.Type<Heartbeat> = sts.struct(() => {
    return  {
        blockNumber: BlockNumber,
        networkState: OpaqueNetworkState,
        sessionIndex: SessionIndex,
        authorityIndex: AuthIndex,
    }
})

export type AuthIndex = number

export const AuthIndex: sts.Type<AuthIndex> = sts.number()

export type SessionIndex = number

export const SessionIndex: sts.Type<SessionIndex> = sts.number()

export type OpaqueNetworkState = {
    peerId: OpaquePeerId,
    externalAddresses: OpaqueMultiaddr[],
}

export const OpaqueNetworkState: sts.Type<OpaqueNetworkState> = sts.struct(() => {
    return  {
        peerId: OpaquePeerId,
        externalAddresses: sts.array(() => OpaqueMultiaddr),
    }
})

export type OpaqueMultiaddr = Bytes

export const OpaqueMultiaddr: sts.Type<OpaqueMultiaddr> = sts.bytes()

export type OpaquePeerId = Bytes

export const OpaquePeerId: sts.Type<OpaquePeerId> = sts.bytes()

export type GrandpaCall = GrandpaCall_report_misbehavior

/**
 *  Report some misbehavior.
 */
export interface GrandpaCall_report_misbehavior {
    __kind: 'report_misbehavior'
    report: Bytes,
}

export const GrandpaCall: sts.Type<GrandpaCall> = sts.closedEnum(() => {
    return  {
        report_misbehavior: sts.enumStruct({
            report: sts.bytes(),
        }),
    }
})

export type FinalityTrackerCall = FinalityTrackerCall_final_hint

/**
 *  Hint that the author of this block thinks the best finalized
 *  block is the given number.
 */
export interface FinalityTrackerCall_final_hint {
    __kind: 'final_hint'
    hint: number,
}

export const FinalityTrackerCall: sts.Type<FinalityTrackerCall> = sts.closedEnum(() => {
    return  {
        final_hint: sts.enumStruct({
            hint: sts.number(),
        }),
    }
})

export type ElectionsPhragmenCall = ElectionsPhragmenCall_remove_member | ElectionsPhragmenCall_remove_voter | ElectionsPhragmenCall_renounce_candidacy | ElectionsPhragmenCall_report_defunct_voter | ElectionsPhragmenCall_submit_candidacy | ElectionsPhragmenCall_vote

/**
 *  Remove a particular member from the set. This is effective immediately and the bond of
 *  the outgoing member is slashed.
 * 
 *  If a runner-up is available, then the best runner-up will be removed and replaces the
 *  outgoing member. Otherwise, a new phragmen round is started.
 * 
 *  Note that this does not affect the designated block number of the next election.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(do_phragmen)
 *  Writes: O(do_phragmen)
 *  # </weight>
 */
export interface ElectionsPhragmenCall_remove_member {
    __kind: 'remove_member'
    who: LookupSource,
}

/**
 *  Remove `origin` as a voter. This removes the lock and returns the bond.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(1)
 *  Writes: O(1)
 *  # </weight>
 */
export interface ElectionsPhragmenCall_remove_voter {
    __kind: 'remove_voter'
}

/**
 *  Renounce one's intention to be a candidate for the next election round. 3 potential
 *  outcomes exist:
 *  - `origin` is a candidate and not elected in any set. In this case, the bond is
 *    unreserved, returned and origin is removed as a candidate.
 *  - `origin` is a current runner up. In this case, the bond is unreserved, returned and
 *    origin is removed as a runner.
 *  - `origin` is a current member. In this case, the bond is unreserved and origin is
 *    removed as a member, consequently not being a candidate for the next round anymore.
 *    Similar to [`remove_voter`], if replacement runners exists, they are immediately used.
 */
export interface ElectionsPhragmenCall_renounce_candidacy {
    __kind: 'renounce_candidacy'
}

/**
 *  Report `target` for being an defunct voter. In case of a valid report, the reporter is
 *  rewarded by the bond amount of `target`. Otherwise, the reporter itself is removed and
 *  their bond is slashed.
 * 
 *  A defunct voter is defined to be:
 *    - a voter whose current submitted votes are all invalid. i.e. all of them are no
 *      longer a candidate nor an active member.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(NLogM) given M current candidates and N votes for `target`.
 *  Writes: O(1)
 *  # </weight>
 */
export interface ElectionsPhragmenCall_report_defunct_voter {
    __kind: 'report_defunct_voter'
    target: LookupSource,
}

/**
 *  Submit oneself for candidacy.
 * 
 *  A candidate will either:
 *    - Lose at the end of the term and forfeit their deposit.
 *    - Win and become a member. Members will eventually get their stash back.
 *    - Become a runner-up. Runners-ups are reserved members in case one gets forcefully
 *      removed.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(LogN) Given N candidates.
 *  Writes: O(1)
 *  # </weight>
 */
export interface ElectionsPhragmenCall_submit_candidacy {
    __kind: 'submit_candidacy'
}

/**
 *  Vote for a set of candidates for the upcoming round of election.
 * 
 *  The `votes` should:
 *    - not be empty.
 *    - be less than the number of candidates.
 * 
 *  Upon voting, `value` units of `who`'s balance is locked and a bond amount is reserved.
 *  It is the responsibility of the caller to not place all of their balance into the lock
 *  and keep some for further transactions.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(1)
 *  Writes: O(V) given `V` votes. V is bounded by 16.
 *  # </weight>
 */
export interface ElectionsPhragmenCall_vote {
    __kind: 'vote'
    votes: AccountId[],
    value: bigint,
}

export const ElectionsPhragmenCall: sts.Type<ElectionsPhragmenCall> = sts.closedEnum(() => {
    return  {
        remove_member: sts.enumStruct({
            who: LookupSource,
        }),
        remove_voter: sts.unit(),
        renounce_candidacy: sts.unit(),
        report_defunct_voter: sts.enumStruct({
            target: LookupSource,
        }),
        submit_candidacy: sts.unit(),
        vote: sts.enumStruct({
            votes: sts.array(() => AccountId),
            value: sts.bigint(),
        }),
    }
})

export type DemocracyCall = DemocracyCall_cancel_queued | DemocracyCall_cancel_referendum | DemocracyCall_clear_public_proposals | DemocracyCall_delegate | DemocracyCall_emergency_cancel | DemocracyCall_external_propose | DemocracyCall_external_propose_default | DemocracyCall_external_propose_majority | DemocracyCall_fast_track | DemocracyCall_note_imminent_preimage | DemocracyCall_note_preimage | DemocracyCall_propose | DemocracyCall_proxy_vote | DemocracyCall_reap_preimage | DemocracyCall_remove_proxy | DemocracyCall_resign_proxy | DemocracyCall_second | DemocracyCall_set_proxy | DemocracyCall_undelegate | DemocracyCall_veto_external | DemocracyCall_vote

/**
 *  Cancel a proposal queued for enactment.
 */
export interface DemocracyCall_cancel_queued {
    __kind: 'cancel_queued'
    when: number,
    which: number,
    what: number,
}

/**
 *  Remove a referendum.
 */
export interface DemocracyCall_cancel_referendum {
    __kind: 'cancel_referendum'
    refIndex: number,
}

/**
 *  Veto and blacklist the proposal hash. Must be from Root origin.
 */
export interface DemocracyCall_clear_public_proposals {
    __kind: 'clear_public_proposals'
}

/**
 *  Delegate vote.
 * 
 *  # <weight>
 *  - One extra DB entry.
 *  # </weight>
 */
export interface DemocracyCall_delegate {
    __kind: 'delegate'
    to: AccountId,
    conviction: Conviction,
}

/**
 *  Schedule an emergency cancellation of a referendum. Cannot happen twice to the same
 *  referendum.
 */
export interface DemocracyCall_emergency_cancel {
    __kind: 'emergency_cancel'
    refIndex: ReferendumIndex,
}

/**
 *  Schedule a referendum to be tabled once it is legal to schedule an external
 *  referendum.
 */
export interface DemocracyCall_external_propose {
    __kind: 'external_propose'
    proposalHash: Hash,
}

/**
 *  Schedule a negative-turnout-bias referendum to be tabled next once it is legal to
 *  schedule an external referendum.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 */
export interface DemocracyCall_external_propose_default {
    __kind: 'external_propose_default'
    proposalHash: Hash,
}

/**
 *  Schedule a majority-carries referendum to be tabled next once it is legal to schedule
 *  an external referendum.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 */
export interface DemocracyCall_external_propose_majority {
    __kind: 'external_propose_majority'
    proposalHash: Hash,
}

/**
 *  Schedule the currently externally-proposed majority-carries referendum to be tabled
 *  immediately. If there is no externally-proposed referendum currently, or if there is one
 *  but it is not a majority-carries referendum then it fails.
 * 
 *  - `proposal_hash`: The hash of the current external proposal.
 *  - `voting_period`: The period that is allowed for voting on this proposal. Increased to
 *    `EmergencyVotingPeriod` if too low.
 *  - `delay`: The number of block after voting has ended in approval and this should be
 *    enacted. This doesn't have a minimum amount.
 */
export interface DemocracyCall_fast_track {
    __kind: 'fast_track'
    proposalHash: Hash,
    votingPeriod: BlockNumber,
    delay: BlockNumber,
}

/**
 *  Register the preimage for an upcoming proposal. This requires the proposal to be
 *  in the dispatch queue. No deposit is needed.
 */
export interface DemocracyCall_note_imminent_preimage {
    __kind: 'note_imminent_preimage'
    encodedProposal: Bytes,
    when: BlockNumber,
    which: number,
}

/**
 *  Register the preimage for an upcoming proposal. This doesn't require the proposal to be
 *  in the dispatch queue but does require a deposit, returned once enacted.
 */
export interface DemocracyCall_note_preimage {
    __kind: 'note_preimage'
    encodedProposal: Bytes,
}

/**
 *  Propose a sensitive action to be taken.
 * 
 *  # <weight>
 *  - O(1).
 *  - Two DB changes, one DB entry.
 *  # </weight>
 */
export interface DemocracyCall_propose {
    __kind: 'propose'
    proposalHash: Hash,
    value: bigint,
}

/**
 *  Vote in a referendum on behalf of a stash. If `vote.is_aye()`, the vote is to enact
 *  the proposal;  otherwise it is a vote to keep the status quo.
 * 
 *  # <weight>
 *  - O(1).
 *  - One DB change, one DB entry.
 *  # </weight>
 */
export interface DemocracyCall_proxy_vote {
    __kind: 'proxy_vote'
    refIndex: number,
    vote: Vote,
}

/**
 *  Remove an expired proposal preimage and collect the deposit.
 */
export interface DemocracyCall_reap_preimage {
    __kind: 'reap_preimage'
    proposalHash: Hash,
}

/**
 *  Clear the proxy. Called by the stash.
 * 
 *  # <weight>
 *  - One DB clear.
 *  # </weight>
 */
export interface DemocracyCall_remove_proxy {
    __kind: 'remove_proxy'
    proxy: AccountId,
}

/**
 *  Clear the proxy. Called by the proxy.
 * 
 *  # <weight>
 *  - One DB clear.
 *  # </weight>
 */
export interface DemocracyCall_resign_proxy {
    __kind: 'resign_proxy'
}

/**
 *  Propose a sensitive action to be taken.
 * 
 *  # <weight>
 *  - O(1).
 *  - One DB entry.
 *  # </weight>
 */
export interface DemocracyCall_second {
    __kind: 'second'
    proposal: number,
}

/**
 *  Specify a proxy. Called by the stash.
 * 
 *  # <weight>
 *  - One extra DB entry.
 *  # </weight>
 */
export interface DemocracyCall_set_proxy {
    __kind: 'set_proxy'
    proxy: AccountId,
}

/**
 *  Undelegate vote.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface DemocracyCall_undelegate {
    __kind: 'undelegate'
}

/**
 *  Veto and blacklist the external proposal hash.
 */
export interface DemocracyCall_veto_external {
    __kind: 'veto_external'
    proposalHash: Hash,
}

/**
 *  Vote in a referendum. If `vote.is_aye()`, the vote is to enact the proposal;
 *  otherwise it is a vote to keep the status quo.
 * 
 *  # <weight>
 *  - O(1).
 *  - One DB change, one DB entry.
 *  # </weight>
 */
export interface DemocracyCall_vote {
    __kind: 'vote'
    refIndex: number,
    vote: Vote,
}

export const DemocracyCall: sts.Type<DemocracyCall> = sts.closedEnum(() => {
    return  {
        cancel_queued: sts.enumStruct({
            when: sts.number(),
            which: sts.number(),
            what: sts.number(),
        }),
        cancel_referendum: sts.enumStruct({
            refIndex: sts.number(),
        }),
        clear_public_proposals: sts.unit(),
        delegate: sts.enumStruct({
            to: AccountId,
            conviction: Conviction,
        }),
        emergency_cancel: sts.enumStruct({
            refIndex: ReferendumIndex,
        }),
        external_propose: sts.enumStruct({
            proposalHash: Hash,
        }),
        external_propose_default: sts.enumStruct({
            proposalHash: Hash,
        }),
        external_propose_majority: sts.enumStruct({
            proposalHash: Hash,
        }),
        fast_track: sts.enumStruct({
            proposalHash: Hash,
            votingPeriod: BlockNumber,
            delay: BlockNumber,
        }),
        note_imminent_preimage: sts.enumStruct({
            encodedProposal: sts.bytes(),
            when: BlockNumber,
            which: sts.number(),
        }),
        note_preimage: sts.enumStruct({
            encodedProposal: sts.bytes(),
        }),
        propose: sts.enumStruct({
            proposalHash: Hash,
            value: sts.bigint(),
        }),
        proxy_vote: sts.enumStruct({
            refIndex: sts.number(),
            vote: Vote,
        }),
        reap_preimage: sts.enumStruct({
            proposalHash: Hash,
        }),
        remove_proxy: sts.enumStruct({
            proxy: AccountId,
        }),
        resign_proxy: sts.unit(),
        second: sts.enumStruct({
            proposal: sts.number(),
        }),
        set_proxy: sts.enumStruct({
            proxy: AccountId,
        }),
        undelegate: sts.unit(),
        veto_external: sts.enumStruct({
            proposalHash: Hash,
        }),
        vote: sts.enumStruct({
            refIndex: sts.number(),
            vote: Vote,
        }),
    }
})

export type Vote = number

export const Vote: sts.Type<Vote> = sts.number()

export type ReferendumIndex = number

export const ReferendumIndex: sts.Type<ReferendumIndex> = sts.number()

export type Conviction = Conviction_Locked1x | Conviction_Locked2x | Conviction_Locked3x | Conviction_Locked4x | Conviction_Locked5x | Conviction_Locked6x | Conviction_None

export interface Conviction_Locked1x {
    __kind: 'Locked1x'
}

export interface Conviction_Locked2x {
    __kind: 'Locked2x'
}

export interface Conviction_Locked3x {
    __kind: 'Locked3x'
}

export interface Conviction_Locked4x {
    __kind: 'Locked4x'
}

export interface Conviction_Locked5x {
    __kind: 'Locked5x'
}

export interface Conviction_Locked6x {
    __kind: 'Locked6x'
}

export interface Conviction_None {
    __kind: 'None'
}

export const Conviction: sts.Type<Conviction> = sts.closedEnum(() => {
    return  {
        Locked1x: sts.unit(),
        Locked2x: sts.unit(),
        Locked3x: sts.unit(),
        Locked4x: sts.unit(),
        Locked5x: sts.unit(),
        Locked6x: sts.unit(),
        None: sts.unit(),
    }
})

export type CouncilCall = CouncilCall_execute | CouncilCall_propose | CouncilCall_set_members | CouncilCall_vote

/**
 *  Dispatch a proposal from a member using the `Member` origin.
 * 
 *  Origin must be a member of the collective.
 */
export interface CouncilCall_execute {
    __kind: 'execute'
    proposal: Proposal,
}

/**
 *  # <weight>
 *  - Bounded storage reads and writes.
 *  - Argument `threshold` has bearing on weight.
 *  # </weight>
 */
export interface CouncilCall_propose {
    __kind: 'propose'
    threshold: number,
    proposal: Proposal,
}

/**
 *  Set the collective's membership manually to `new_members`. Be nice to the chain and
 *  provide it pre-sorted.
 * 
 *  Requires root origin.
 */
export interface CouncilCall_set_members {
    __kind: 'set_members'
    newMembers: AccountId[],
}

/**
 *  # <weight>
 *  - Bounded storage read and writes.
 *  - Will be slightly heavier if the proposal is approved / disapproved after the vote.
 *  # </weight>
 */
export interface CouncilCall_vote {
    __kind: 'vote'
    proposal: Hash,
    index: number,
    approve: boolean,
}

export const CouncilCall: sts.Type<CouncilCall> = sts.closedEnum(() => {
    return  {
        execute: sts.enumStruct({
            proposal: Proposal,
        }),
        propose: sts.enumStruct({
            threshold: sts.number(),
            proposal: Proposal,
        }),
        set_members: sts.enumStruct({
            newMembers: sts.array(() => AccountId),
        }),
        vote: sts.enumStruct({
            proposal: Hash,
            index: sts.number(),
            approve: sts.boolean(),
        }),
    }
})

export type ClaimsCall = ClaimsCall_claim | ClaimsCall_mint_claim

/**
 *  Make a claim.
 */
export interface ClaimsCall_claim {
    __kind: 'claim'
    dest: AccountId,
    ethereumSignature: EcdsaSignature,
}

/**
 *  Add a new claim, if you are root.
 */
export interface ClaimsCall_mint_claim {
    __kind: 'mint_claim'
    who: EthereumAddress,
    value: BalanceOf,
    vestingSchedule?: ([BalanceOf, BalanceOf, BlockNumber] | undefined),
}

export const ClaimsCall: sts.Type<ClaimsCall> = sts.closedEnum(() => {
    return  {
        claim: sts.enumStruct({
            dest: AccountId,
            ethereumSignature: EcdsaSignature,
        }),
        mint_claim: sts.enumStruct({
            who: EthereumAddress,
            value: BalanceOf,
            vestingSchedule: sts.option(() => sts.tuple(() => BalanceOf, BalanceOf, BlockNumber)),
        }),
    }
})

export type BalanceOf = bigint

export const BalanceOf: sts.Type<BalanceOf> = sts.bigint()

export type EthereumAddress = Bytes

export const EthereumAddress: sts.Type<EthereumAddress> = sts.bytes()

export type EcdsaSignature = Bytes

export const EcdsaSignature: sts.Type<EcdsaSignature> = sts.bytes()

export type BalancesCall = BalancesCall_force_transfer | BalancesCall_set_balance | BalancesCall_transfer | BalancesCall_transfer_keep_alive

/**
 *  Exactly as `transfer`, except the origin must be root and the source account may be
 *  specified.
 */
export interface BalancesCall_force_transfer {
    __kind: 'force_transfer'
    source: LookupSource,
    dest: LookupSource,
    value: bigint,
}

/**
 *  Set the balances of a given account.
 * 
 *  This will alter `FreeBalance` and `ReservedBalance` in storage. it will
 *  also decrease the total issuance of the system (`TotalIssuance`).
 *  If the new free or reserved balance is below the existential deposit,
 *  it will reset the account nonce (`system::AccountNonce`).
 * 
 *  The dispatch origin for this call is `root`.
 * 
 *  # <weight>
 *  - Independent of the arguments.
 *  - Contains a limited number of reads and writes.
 *  # </weight>
 */
export interface BalancesCall_set_balance {
    __kind: 'set_balance'
    who: LookupSource,
    newFree: bigint,
    newReserved: bigint,
}

/**
 *  Transfer some liquid free balance to another account.
 * 
 *  `transfer` will set the `FreeBalance` of the sender and receiver.
 *  It will decrease the total issuance of the system by the `TransferFee`.
 *  If the sender's account is below the existential deposit as a result
 *  of the transfer, the account will be reaped.
 * 
 *  The dispatch origin for this call must be `Signed` by the transactor.
 * 
 *  # <weight>
 *  - Dependent on arguments but not critical, given proper implementations for
 *    input config types. See related functions below.
 *  - It contains a limited number of reads and writes internally and no complex computation.
 * 
 *  Related functions:
 * 
 *    - `ensure_can_withdraw` is always called internally but has a bounded complexity.
 *    - Transferring balances to accounts that did not exist before will cause
 *       `T::OnNewAccount::on_new_account` to be called.
 *    - Removing enough funds from an account will trigger
 *      `T::DustRemoval::on_unbalanced` and `T::OnFreeBalanceZero::on_free_balance_zero`.
 *    - `transfer_keep_alive` works the same way as `transfer`, but has an additional
 *      check that the transfer will not kill the origin account.
 * 
 *  # </weight>
 */
export interface BalancesCall_transfer {
    __kind: 'transfer'
    dest: LookupSource,
    value: bigint,
}

/**
 *  Same as the [`transfer`] call, but with a check that the transfer will not kill the
 *  origin account.
 * 
 *  99% of the time you want [`transfer`] instead.
 * 
 *  [`transfer`]: struct.Module.html#method.transfer
 */
export interface BalancesCall_transfer_keep_alive {
    __kind: 'transfer_keep_alive'
    dest: LookupSource,
    value: bigint,
}

export const BalancesCall: sts.Type<BalancesCall> = sts.closedEnum(() => {
    return  {
        force_transfer: sts.enumStruct({
            source: LookupSource,
            dest: LookupSource,
            value: sts.bigint(),
        }),
        set_balance: sts.enumStruct({
            who: LookupSource,
            newFree: sts.bigint(),
            newReserved: sts.bigint(),
        }),
        transfer: sts.enumStruct({
            dest: LookupSource,
            value: sts.bigint(),
        }),
        transfer_keep_alive: sts.enumStruct({
            dest: LookupSource,
            value: sts.bigint(),
        }),
    }
})

export type BabeCall = never

export type AuthorshipCall = AuthorshipCall_set_uncles

/**
 *  Provide a set of uncles.
 */
export interface AuthorshipCall_set_uncles {
    __kind: 'set_uncles'
    newUncles: Header[],
}

export const AuthorshipCall: sts.Type<AuthorshipCall> = sts.closedEnum(() => {
    return  {
        set_uncles: sts.enumStruct({
            newUncles: sts.array(() => Header),
        }),
    }
})

export type Header = {
    parentHash: Hash,
    number: number,
    stateRoot: Hash,
    extrinsicsRoot: Hash,
    digest: Digest,
}

export const Header: sts.Type<Header> = sts.struct(() => {
    return  {
        parentHash: Hash,
        number: sts.number(),
        stateRoot: Hash,
        extrinsicsRoot: Hash,
        digest: Digest,
    }
})

export type Digest = {
    logs: DigestItem[],
}

export const Digest: sts.Type<Digest> = sts.struct(() => {
    return  {
        logs: sts.array(() => DigestItem),
    }
})

export type DigestItem = DigestItem_AuthoritiesChange | DigestItem_ChangesTrieRoot | DigestItem_ChangesTrieSignal | DigestItem_Consensus | DigestItem_Other | DigestItem_PreRuntime | DigestItem_RuntimeEnvironmentUpdated | DigestItem_Seal | DigestItem_SealV0

export interface DigestItem_AuthoritiesChange {
    __kind: 'AuthoritiesChange'
    value: AuthorityId[]
}

export interface DigestItem_ChangesTrieRoot {
    __kind: 'ChangesTrieRoot'
    value: Hash
}

export interface DigestItem_ChangesTrieSignal {
    __kind: 'ChangesTrieSignal'
    value: ChangesTrieSignal
}

export interface DigestItem_Consensus {
    __kind: 'Consensus'
    value: Consensus
}

export interface DigestItem_Other {
    __kind: 'Other'
    value: Bytes
}

export interface DigestItem_PreRuntime {
    __kind: 'PreRuntime'
    value: PreRuntime
}

export interface DigestItem_RuntimeEnvironmentUpdated {
    __kind: 'RuntimeEnvironmentUpdated'
}

export interface DigestItem_Seal {
    __kind: 'Seal'
    value: Seal
}

export interface DigestItem_SealV0 {
    __kind: 'SealV0'
    value: SealV0
}

export const DigestItem: sts.Type<DigestItem> = sts.closedEnum(() => {
    return  {
        AuthoritiesChange: sts.array(() => AuthorityId),
        ChangesTrieRoot: Hash,
        ChangesTrieSignal: ChangesTrieSignal,
        Consensus: Consensus,
        Other: sts.bytes(),
        PreRuntime: PreRuntime,
        RuntimeEnvironmentUpdated: sts.unit(),
        Seal: Seal,
        SealV0: SealV0,
    }
})

export type SealV0 = [bigint, Signature]

export const SealV0: sts.Type<SealV0> = sts.tuple(() => sts.bigint(), Signature)

export type Seal = [ConsensusEngineId, Bytes]

export const Seal: sts.Type<Seal> = sts.tuple(() => ConsensusEngineId, sts.bytes())

export type PreRuntime = [ConsensusEngineId, Bytes]

export const PreRuntime: sts.Type<PreRuntime> = sts.tuple(() => ConsensusEngineId, sts.bytes())

export type Consensus = [ConsensusEngineId, Bytes]

export const Consensus: sts.Type<Consensus> = sts.tuple(() => ConsensusEngineId, sts.bytes())

export type ConsensusEngineId = Bytes

export const ConsensusEngineId: sts.Type<ConsensusEngineId> = sts.bytes()

export type ChangesTrieSignal = ChangesTrieSignal_NewConfiguration

export interface ChangesTrieSignal_NewConfiguration {
    __kind: 'NewConfiguration'
    value?: (ChangesTrieConfiguration | undefined)
}

export const ChangesTrieSignal: sts.Type<ChangesTrieSignal> = sts.closedEnum(() => {
    return  {
        NewConfiguration: sts.option(() => ChangesTrieConfiguration),
    }
})

export type ChangesTrieConfiguration = {
    digestInterval: number,
    digestLevels: number,
}

export const ChangesTrieConfiguration: sts.Type<ChangesTrieConfiguration> = sts.struct(() => {
    return  {
        digestInterval: sts.number(),
        digestLevels: sts.number(),
    }
})

export type AuthorityId = Bytes

export const AuthorityId: sts.Type<AuthorityId> = sts.bytes()

export type AuthorityDiscoveryCall = never

export type AttestationsCall = AttestationsCall_more_attestations

/**
 *  Provide candidate receipts for parachains, in ascending order by id.
 */
export interface AttestationsCall_more_attestations {
    __kind: 'more_attestations'
}

export const AttestationsCall: sts.Type<AttestationsCall> = sts.closedEnum(() => {
    return  {
        more_attestations: sts.unit(),
    }
})
