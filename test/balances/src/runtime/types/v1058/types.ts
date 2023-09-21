import {sts, Result, Option, Bytes} from '../../pallet.support'

export type Type_176 = Type_176_Attestations | Type_176_AuthorityDiscovery | Type_176_Authorship | Type_176_Babe | Type_176_Balances | Type_176_Claims | Type_176_Council | Type_176_Democracy | Type_176_ElectionsPhragmen | Type_176_FinalityTracker | Type_176_Grandpa | Type_176_Identity | Type_176_ImOnline | Type_176_Indices | Type_176_Offences | Type_176_Parachains | Type_176_Recovery | Type_176_Registrar | Type_176_Scheduler | Type_176_Session | Type_176_Slots | Type_176_Society | Type_176_Staking | Type_176_System | Type_176_TechnicalCommittee | Type_176_TechnicalMembership | Type_176_Timestamp | Type_176_Treasury | Type_176_Utility | Type_176_Vesting

export interface Type_176_Attestations {
    __kind: 'Attestations'
    value: AttestationsCall
}

export interface Type_176_AuthorityDiscovery {
    __kind: 'AuthorityDiscovery'
    value: AuthorityDiscoveryCall
}

export interface Type_176_Authorship {
    __kind: 'Authorship'
    value: AuthorshipCall
}

export interface Type_176_Babe {
    __kind: 'Babe'
    value: BabeCall
}

export interface Type_176_Balances {
    __kind: 'Balances'
    value: BalancesCall
}

export interface Type_176_Claims {
    __kind: 'Claims'
    value: ClaimsCall
}

export interface Type_176_Council {
    __kind: 'Council'
    value: CouncilCall
}

export interface Type_176_Democracy {
    __kind: 'Democracy'
    value: DemocracyCall
}

export interface Type_176_ElectionsPhragmen {
    __kind: 'ElectionsPhragmen'
    value: ElectionsPhragmenCall
}

export interface Type_176_FinalityTracker {
    __kind: 'FinalityTracker'
    value: FinalityTrackerCall
}

export interface Type_176_Grandpa {
    __kind: 'Grandpa'
    value: GrandpaCall
}

export interface Type_176_Identity {
    __kind: 'Identity'
    value: IdentityCall
}

export interface Type_176_ImOnline {
    __kind: 'ImOnline'
    value: ImOnlineCall
}

export interface Type_176_Indices {
    __kind: 'Indices'
    value: IndicesCall
}

export interface Type_176_Offences {
    __kind: 'Offences'
    value: OffencesCall
}

export interface Type_176_Parachains {
    __kind: 'Parachains'
    value: ParachainsCall
}

export interface Type_176_Recovery {
    __kind: 'Recovery'
    value: RecoveryCall
}

export interface Type_176_Registrar {
    __kind: 'Registrar'
    value: RegistrarCall
}

export interface Type_176_Scheduler {
    __kind: 'Scheduler'
    value: SchedulerCall
}

export interface Type_176_Session {
    __kind: 'Session'
    value: SessionCall
}

export interface Type_176_Slots {
    __kind: 'Slots'
    value: SlotsCall
}

export interface Type_176_Society {
    __kind: 'Society'
    value: SocietyCall
}

export interface Type_176_Staking {
    __kind: 'Staking'
    value: StakingCall
}

export interface Type_176_System {
    __kind: 'System'
    value: SystemCall
}

export interface Type_176_TechnicalCommittee {
    __kind: 'TechnicalCommittee'
    value: TechnicalCommitteeCall
}

export interface Type_176_TechnicalMembership {
    __kind: 'TechnicalMembership'
    value: TechnicalMembershipCall
}

export interface Type_176_Timestamp {
    __kind: 'Timestamp'
    value: TimestampCall
}

export interface Type_176_Treasury {
    __kind: 'Treasury'
    value: TreasuryCall
}

export interface Type_176_Utility {
    __kind: 'Utility'
    value: UtilityCall
}

export interface Type_176_Vesting {
    __kind: 'Vesting'
    value: VestingCall
}

export const Type_176: sts.Type<Type_176> = sts.closedEnum(() => {
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
        Identity: IdentityCall,
        ImOnline: ImOnlineCall,
        Indices: IndicesCall,
        Offences: OffencesCall,
        Parachains: ParachainsCall,
        Recovery: RecoveryCall,
        Registrar: RegistrarCall,
        Scheduler: SchedulerCall,
        Session: SessionCall,
        Slots: SlotsCall,
        Society: SocietyCall,
        Staking: StakingCall,
        System: SystemCall,
        TechnicalCommittee: TechnicalCommitteeCall,
        TechnicalMembership: TechnicalMembershipCall,
        Timestamp: TimestampCall,
        Treasury: TreasuryCall,
        Utility: UtilityCall,
        Vesting: VestingCall,
    }
})

export type VestingCall = VestingCall_vest | VestingCall_vest_other | VestingCall_vested_transfer

/**
 *  Unlock any vested funds of the sender account.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have funds still
 *  locked under this module.
 * 
 *  Emits either `VestingCompleted` or `VestingUpdated`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One balance-lock operation.
 *  - One storage read (codec `O(1)`) and up to one removal.
 *  - One event.
 *  # </weight>
 */
export interface VestingCall_vest {
    __kind: 'vest'
}

/**
 *  Unlock any vested funds of a `target` account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `target`: The account whose vested funds should be unlocked. Must have funds still
 *  locked under this module.
 * 
 *  Emits either `VestingCompleted` or `VestingUpdated`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - Up to one account lookup.
 *  - One balance-lock operation.
 *  - One storage read (codec `O(1)`) and up to one removal.
 *  - One event.
 *  # </weight>
 */
export interface VestingCall_vest_other {
    __kind: 'vest_other'
    target: LookupSource,
}

/**
 *  Create a vested transfer.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `target`: The account that should be transferred the vested funds.
 *  - `amount`: The amount of funds to transfer and will be vested.
 *  - `schedule`: The vesting schedule attached to the transfer.
 * 
 *  Emits `VestingCreated`.
 * 
 *  # <weight>
 *  - Creates a new storage entry, but is protected by a minimum transfer
 * 	   amount needed to succeed.
 *  # </weight>
 */
export interface VestingCall_vested_transfer {
    __kind: 'vested_transfer'
    target: LookupSource,
    schedule: VestingInfo,
}

export const VestingCall: sts.Type<VestingCall> = sts.closedEnum(() => {
    return  {
        vest: sts.unit(),
        vest_other: sts.enumStruct({
            target: LookupSource,
        }),
        vested_transfer: sts.enumStruct({
            target: LookupSource,
            schedule: VestingInfo,
        }),
    }
})

export type VestingInfo = {
    locked: Balance,
    perBlock: Balance,
    startingBlock: BlockNumber,
}

export const VestingInfo: sts.Type<VestingInfo> = sts.struct(() => {
    return  {
        locked: Balance,
        perBlock: Balance,
        startingBlock: BlockNumber,
    }
})

export type Balance = bigint

export const Balance: sts.Type<Balance> = sts.bigint()

export type LookupSource = Bytes

export const LookupSource: sts.Type<LookupSource> = sts.bytes()

export type UtilityCall = UtilityCall_approve_as_multi | UtilityCall_as_multi | UtilityCall_as_sub | UtilityCall_batch | UtilityCall_cancel_as_multi

/**
 *  Register approval for a dispatch to be made from a deterministic composite account if
 *  approved by a total of `threshold - 1` of `other_signatories`.
 * 
 *  Payment: `MultisigDepositBase` will be reserved if this is the first approval, plus
 *  `threshold` times `MultisigDepositFactor`. It is returned once this dispatch happens or
 *  is cancelled.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `threshold`: The total number of approvals for this dispatch before it is executed.
 *  - `other_signatories`: The accounts (other than the sender) who can approve this
 *  dispatch. May not be empty.
 *  - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
 *  not the first approval, then it must be `Some`, with the timepoint (block number and
 *  transaction index) of the first approval transaction.
 *  - `call_hash`: The hash of the call to be executed.
 * 
 *  NOTE: If this is the final approval, you will want to use `as_multi` instead.
 * 
 *  # <weight>
 *  - `O(S)`.
 *  - Up to one balance-reserve or unreserve operation.
 *  - One passthrough operation, one insert, both `O(S)` where `S` is the number of
 *    signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
 *  - One encode & hash, both of complexity `O(S)`.
 *  - Up to one binary search and insert (`O(logS + S)`).
 *  - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
 *  - One event.
 *  - Storage: inserts one item, value size bounded by `MaxSignatories`, with a
 *    deposit taken for its lifetime of
 *    `MultisigDepositBase + threshold * MultisigDepositFactor`.
 *  # </weight>
 */
export interface UtilityCall_approve_as_multi {
    __kind: 'approve_as_multi'
    threshold: number,
    otherSignatories: AccountId[],
    maybeTimepoint?: (Timepoint | undefined),
    callHash: Bytes,
}

/**
 *  Register approval for a dispatch to be made from a deterministic composite account if
 *  approved by a total of `threshold - 1` of `other_signatories`.
 * 
 *  If there are enough, then dispatch the call.
 * 
 *  Payment: `MultisigDepositBase` will be reserved if this is the first approval, plus
 *  `threshold` times `MultisigDepositFactor`. It is returned once this dispatch happens or
 *  is cancelled.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `threshold`: The total number of approvals for this dispatch before it is executed.
 *  - `other_signatories`: The accounts (other than the sender) who can approve this
 *  dispatch. May not be empty.
 *  - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
 *  not the first approval, then it must be `Some`, with the timepoint (block number and
 *  transaction index) of the first approval transaction.
 *  - `call`: The call to be executed.
 * 
 *  NOTE: Unless this is the final approval, you will generally want to use
 *  `approve_as_multi` instead, since it only requires a hash of the call.
 * 
 *  Result is equivalent to the dispatched result if `threshold` is exactly `1`. Otherwise
 *  on success, result is `Ok` and the result from the interior call, if it was executed,
 *  may be found in the deposited `MultisigExecuted` event.
 * 
 *  # <weight>
 *  - `O(S + Z + Call)`.
 *  - Up to one balance-reserve or unreserve operation.
 *  - One passthrough operation, one insert, both `O(S)` where `S` is the number of
 *    signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
 *  - One call encode & hash, both of complexity `O(Z)` where `Z` is tx-len.
 *  - One encode & hash, both of complexity `O(S)`.
 *  - Up to one binary search and insert (`O(logS + S)`).
 *  - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
 *  - One event.
 *  - The weight of the `call`.
 *  - Storage: inserts one item, value size bounded by `MaxSignatories`, with a
 *    deposit taken for its lifetime of
 *    `MultisigDepositBase + threshold * MultisigDepositFactor`.
 *  # </weight>
 */
export interface UtilityCall_as_multi {
    __kind: 'as_multi'
    threshold: number,
    otherSignatories: AccountId[],
    maybeTimepoint?: (Timepoint | undefined),
    call: Type_176,
}

/**
 *  Send a call through an indexed pseudonym of the sender.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - The weight of the `call` + 10,000.
 *  # </weight>
 */
export interface UtilityCall_as_sub {
    __kind: 'as_sub'
    index: number,
    call: Type_176,
}

/**
 *  Send a batch of dispatch calls.
 * 
 *  This will execute until the first one fails and then stop.
 * 
 *  May be called from any origin.
 * 
 *  - `calls`: The calls to be dispatched from the same origin.
 * 
 *  # <weight>
 *  - The sum of the weights of the `calls`.
 *  - One event.
 *  # </weight>
 * 
 *  This will return `Ok` in all circumstances. To determine the success of the batch, an
 *  event is deposited. If a call failed and the batch was interrupted, then the
 *  `BatchInterrupted` event is deposited, along with the number of successful calls made
 *  and the error of the failed call. If all were successful, then the `BatchCompleted`
 *  event is deposited.
 */
export interface UtilityCall_batch {
    __kind: 'batch'
    calls: Type_176[],
}

/**
 *  Cancel a pre-existing, on-going multisig transaction. Any deposit reserved previously
 *  for this operation will be unreserved on success.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `threshold`: The total number of approvals for this dispatch before it is executed.
 *  - `other_signatories`: The accounts (other than the sender) who can approve this
 *  dispatch. May not be empty.
 *  - `timepoint`: The timepoint (block number and transaction index) of the first approval
 *  transaction for this dispatch.
 *  - `call_hash`: The hash of the call to be executed.
 * 
 *  # <weight>
 *  - `O(S)`.
 *  - Up to one balance-reserve or unreserve operation.
 *  - One passthrough operation, one insert, both `O(S)` where `S` is the number of
 *    signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
 *  - One encode & hash, both of complexity `O(S)`.
 *  - One event.
 *  - I/O: 1 read `O(S)`, one remove.
 *  - Storage: removes one item.
 *  # </weight>
 */
export interface UtilityCall_cancel_as_multi {
    __kind: 'cancel_as_multi'
    threshold: number,
    otherSignatories: AccountId[],
    timepoint: Timepoint,
    callHash: Bytes,
}

export const UtilityCall: sts.Type<UtilityCall> = sts.closedEnum(() => {
    return  {
        approve_as_multi: sts.enumStruct({
            threshold: sts.number(),
            otherSignatories: sts.array(() => AccountId),
            maybeTimepoint: sts.option(() => Timepoint),
            callHash: sts.bytes(),
        }),
        as_multi: sts.enumStruct({
            threshold: sts.number(),
            otherSignatories: sts.array(() => AccountId),
            maybeTimepoint: sts.option(() => Timepoint),
            call: Type_176,
        }),
        as_sub: sts.enumStruct({
            index: sts.number(),
            call: Type_176,
        }),
        batch: sts.enumStruct({
            calls: sts.array(() => Type_176),
        }),
        cancel_as_multi: sts.enumStruct({
            threshold: sts.number(),
            otherSignatories: sts.array(() => AccountId),
            timepoint: Timepoint,
            callHash: sts.bytes(),
        }),
    }
})

export type TreasuryCall = TreasuryCall_approve_proposal | TreasuryCall_close_tip | TreasuryCall_propose_spend | TreasuryCall_reject_proposal | TreasuryCall_report_awesome | TreasuryCall_retract_tip | TreasuryCall_tip | TreasuryCall_tip_new

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
 *  Close and payout a tip.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  The tip identified by `hash` must have finished its countdown period.
 * 
 *  - `hash`: The identity of the open tip for which a tip value is declared. This is formed
 *    as the hash of the tuple of the original tip `reason` and the beneficiary account ID.
 * 
 *  # <weight>
 *  - `O(T)`
 *  - One storage retrieval (codec `O(T)`) and two removals.
 *  - Up to three balance operations.
 *  # </weight>
 */
export interface TreasuryCall_close_tip {
    __kind: 'close_tip'
    hash: Hash,
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

/**
 *  Report something `reason` that deserves a tip and claim any eventual the finder's fee.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Payment: `TipReportDepositBase` will be reserved from the origin account, as well as
 *  `TipReportDepositPerByte` for each byte in `reason`.
 * 
 *  - `reason`: The reason for, or the thing that deserves, the tip; generally this will be
 *    a UTF-8-encoded URL.
 *  - `who`: The account which should be credited for the tip.
 * 
 *  Emits `NewTip` if successful.
 * 
 *  # <weight>
 *  - `O(R)` where `R` length of `reason`.
 *  - One balance operation.
 *  - One storage mutation (codec `O(R)`).
 *  - One event.
 *  # </weight>
 */
export interface TreasuryCall_report_awesome {
    __kind: 'report_awesome'
    reason: Bytes,
    who: AccountId,
}

/**
 *  Retract a prior tip-report from `report_awesome`, and cancel the process of tipping.
 * 
 *  If successful, the original deposit will be unreserved.
 * 
 *  The dispatch origin for this call must be _Signed_ and the tip identified by `hash`
 *  must have been reported by the signing account through `report_awesome` (and not
 *  through `tip_new`).
 * 
 *  - `hash`: The identity of the open tip for which a tip value is declared. This is formed
 *    as the hash of the tuple of the original tip `reason` and the beneficiary account ID.
 * 
 *  Emits `TipRetracted` if successful.
 * 
 *  # <weight>
 *  - `O(T)`
 *  - One balance operation.
 *  - Two storage removals (one read, codec `O(T)`).
 *  - One event.
 *  # </weight>
 */
export interface TreasuryCall_retract_tip {
    __kind: 'retract_tip'
    hash: Hash,
}

/**
 *  Declare a tip value for an already-open tip.
 * 
 *  The dispatch origin for this call must be _Signed_ and the signing account must be a
 *  member of the `Tippers` set.
 * 
 *  - `hash`: The identity of the open tip for which a tip value is declared. This is formed
 *    as the hash of the tuple of the hash of the original tip `reason` and the beneficiary
 *    account ID.
 *  - `tip_value`: The amount of tip that the sender would like to give. The median tip
 *    value of active tippers will be given to the `who`.
 * 
 *  Emits `TipClosing` if the threshold of tippers has been reached and the countdown period
 *  has started.
 * 
 *  # <weight>
 *  - `O(T)`
 *  - One storage mutation (codec `O(T)`), one storage read `O(1)`.
 *  - Up to one event.
 *  # </weight>
 */
export interface TreasuryCall_tip {
    __kind: 'tip'
    hash: Hash,
    tipValue: BalanceOf,
}

/**
 *  Give a tip for something new; no finder's fee will be taken.
 * 
 *  The dispatch origin for this call must be _Signed_ and the signing account must be a
 *  member of the `Tippers` set.
 * 
 *  - `reason`: The reason for, or the thing that deserves, the tip; generally this will be
 *    a UTF-8-encoded URL.
 *  - `who`: The account which should be credited for the tip.
 *  - `tip_value`: The amount of tip that the sender would like to give. The median tip
 *    value of active tippers will be given to the `who`.
 * 
 *  Emits `NewTip` if successful.
 * 
 *  # <weight>
 *  - `O(R + T)` where `R` length of `reason`, `T` is the number of tippers. `T` is
 *    naturally capped as a membership set, `R` is limited through transaction-size.
 *  - Two storage insertions (codecs `O(R)`, `O(T)`), one read `O(1)`.
 *  - One event.
 *  # </weight>
 */
export interface TreasuryCall_tip_new {
    __kind: 'tip_new'
    reason: Bytes,
    who: AccountId,
    tipValue: BalanceOf,
}

export const TreasuryCall: sts.Type<TreasuryCall> = sts.closedEnum(() => {
    return  {
        approve_proposal: sts.enumStruct({
            proposalId: sts.number(),
        }),
        close_tip: sts.enumStruct({
            hash: Hash,
        }),
        propose_spend: sts.enumStruct({
            value: sts.bigint(),
            beneficiary: LookupSource,
        }),
        reject_proposal: sts.enumStruct({
            proposalId: sts.number(),
        }),
        report_awesome: sts.enumStruct({
            reason: sts.bytes(),
            who: AccountId,
        }),
        retract_tip: sts.enumStruct({
            hash: Hash,
        }),
        tip: sts.enumStruct({
            hash: Hash,
            tipValue: BalanceOf,
        }),
        tip_new: sts.enumStruct({
            reason: sts.bytes(),
            who: AccountId,
            tipValue: BalanceOf,
        }),
    }
})

export type BalanceOf = bigint

export const BalanceOf: sts.Type<BalanceOf> = sts.bigint()

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

export type TechnicalMembershipCall = TechnicalMembershipCall_add_member | TechnicalMembershipCall_change_key | TechnicalMembershipCall_clear_prime | TechnicalMembershipCall_remove_member | TechnicalMembershipCall_reset_members | TechnicalMembershipCall_set_prime | TechnicalMembershipCall_swap_member

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
 *  Swap out the sending member for some other key `new`.
 * 
 *  May only be called from `Signed` origin of a current member.
 * 
 *  Prime membership is passed from the origin account to `new`, if extant.
 */
export interface TechnicalMembershipCall_change_key {
    __kind: 'change_key'
    new: AccountId,
}

/**
 *  Remove the prime member if it exists.
 */
export interface TechnicalMembershipCall_clear_prime {
    __kind: 'clear_prime'
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
 *  Set the prime member. Must be a current member.
 */
export interface TechnicalMembershipCall_set_prime {
    __kind: 'set_prime'
    who: AccountId,
}

/**
 *  Swap out one member `remove` for another `add`.
 * 
 *  May only be called from `SwapOrigin` or root.
 * 
 *  Prime membership is *not* passed from `remove` to `add`, if extant.
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
        change_key: sts.enumStruct({
            new: AccountId,
        }),
        clear_prime: sts.unit(),
        remove_member: sts.enumStruct({
            who: AccountId,
        }),
        reset_members: sts.enumStruct({
            members: sts.array(() => AccountId),
        }),
        set_prime: sts.enumStruct({
            who: AccountId,
        }),
        swap_member: sts.enumStruct({
            remove: AccountId,
            add: AccountId,
        }),
    }
})

export type TechnicalCommitteeCall = TechnicalCommitteeCall_close | TechnicalCommitteeCall_execute | TechnicalCommitteeCall_propose | TechnicalCommitteeCall_set_members | TechnicalCommitteeCall_vote

/**
 *  May be called by any signed account after the voting duration has ended in order to
 *  finish voting and close the proposal.
 * 
 *  Abstentions are counted as rejections unless there is a prime member set and the prime
 *  member cast an approval.
 * 
 *  - the weight of `proposal` preimage.
 *  - up to three events deposited.
 *  - one read, two removals, one mutation. (plus three static reads.)
 *  - computation and i/o `O(P + L + M)` where:
 *    - `M` is number of members,
 *    - `P` is number of active proposals,
 *    - `L` is the encoded length of `proposal` preimage.
 */
export interface TechnicalCommitteeCall_close {
    __kind: 'close'
    proposal: Hash,
    index: number,
}

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
 *  Set the collective's membership.
 * 
 *  - `new_members`: The new member list. Be nice to the chain and
 *  - `prime`: The prime member whose vote sets the default.
 * 
 *  Requires root origin.
 */
export interface TechnicalCommitteeCall_set_members {
    __kind: 'set_members'
    newMembers: AccountId[],
    prime?: (AccountId | undefined),
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
        close: sts.enumStruct({
            proposal: Hash,
            index: sts.number(),
        }),
        execute: sts.enumStruct({
            proposal: Proposal,
        }),
        propose: sts.enumStruct({
            threshold: sts.number(),
            proposal: Proposal,
        }),
        set_members: sts.enumStruct({
            newMembers: sts.array(() => AccountId),
            prime: sts.option(() => AccountId),
        }),
        vote: sts.enumStruct({
            proposal: Hash,
            index: sts.number(),
            approve: sts.boolean(),
        }),
    }
})

export type SystemCall = SystemCall_fill_block | SystemCall_kill_prefix | SystemCall_kill_storage | SystemCall_remark | SystemCall_set_changes_trie_config | SystemCall_set_code | SystemCall_set_code_without_checks | SystemCall_set_heap_pages | SystemCall_set_storage | SystemCall_suicide

/**
 *  A dispatch that will fill the block weight up to the given ratio.
 */
export interface SystemCall_fill_block {
    __kind: 'fill_block'
    ratio: Perbill,
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
 *  Set the new changes trie configuration.
 */
export interface SystemCall_set_changes_trie_config {
    __kind: 'set_changes_trie_config'
    changesTrieConfig?: (ChangesTrieConfiguration | undefined),
}

/**
 *  Set the new runtime code.
 */
export interface SystemCall_set_code {
    __kind: 'set_code'
    code: Bytes,
}

/**
 *  Set the new runtime code without doing any checks of the given `code`.
 */
export interface SystemCall_set_code_without_checks {
    __kind: 'set_code_without_checks'
    code: Bytes,
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

/**
 *  Kill the sending account, assuming there are no references outstanding and the composite
 *  data is equal to its default value.
 */
export interface SystemCall_suicide {
    __kind: 'suicide'
}

export const SystemCall: sts.Type<SystemCall> = sts.closedEnum(() => {
    return  {
        fill_block: sts.enumStruct({
            ratio: Perbill,
        }),
        kill_prefix: sts.enumStruct({
            prefix: Key,
        }),
        kill_storage: sts.enumStruct({
            keys: sts.array(() => Key),
        }),
        remark: sts.enumStruct({
            remark: sts.bytes(),
        }),
        set_changes_trie_config: sts.enumStruct({
            changesTrieConfig: sts.option(() => ChangesTrieConfiguration),
        }),
        set_code: sts.enumStruct({
            code: sts.bytes(),
        }),
        set_code_without_checks: sts.enumStruct({
            code: sts.bytes(),
        }),
        set_heap_pages: sts.enumStruct({
            pages: sts.bigint(),
        }),
        set_storage: sts.enumStruct({
            items: sts.array(() => KeyValue),
        }),
        suicide: sts.unit(),
    }
})

export type KeyValue = [StorageKey, StorageData]

export const KeyValue: sts.Type<KeyValue> = sts.tuple(() => StorageKey, StorageData)

export type StorageData = Bytes

export const StorageData: sts.Type<StorageData> = sts.bytes()

export type StorageKey = Bytes

export const StorageKey: sts.Type<StorageKey> = sts.bytes()

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

export type Key = Bytes

export const Key: sts.Type<Key> = sts.bytes()

export type Perbill = number

export const Perbill: sts.Type<Perbill> = sts.number()

export type StakingCall = StakingCall_bond | StakingCall_bond_extra | StakingCall_cancel_deferred_slash | StakingCall_chill | StakingCall_force_new_era | StakingCall_force_new_era_always | StakingCall_force_no_eras | StakingCall_force_unstake | StakingCall_nominate | StakingCall_payout_nominator | StakingCall_payout_stakers | StakingCall_payout_validator | StakingCall_reap_stash | StakingCall_rebond | StakingCall_set_controller | StakingCall_set_history_depth | StakingCall_set_invulnerables | StakingCall_set_payee | StakingCall_set_validator_count | StakingCall_submit_election_solution | StakingCall_submit_election_solution_unsigned | StakingCall_unbond | StakingCall_validate | StakingCall_withdraw_unbonded

/**
 *  Take the origin account as a stash and lock up `value` of its balance. `controller` will
 *  be the account that controls it.
 * 
 *  `value` must be more than the `minimum_balance` specified by `T::Currency`.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash account.
 * 
 *  Emits `Bonded`.
 * 
 *  # <weight>
 *  - Independent of the arguments. Moderate complexity.
 *  - O(1).
 *  - Three extra DB entries.
 * 
 *  NOTE: Two of the storage writes (`Self::bonded`, `Self::payee`) are _never_ cleaned
 *  unless the `origin` falls below _existential deposit_ and gets removed as dust.
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
 *  The dispatch origin for this call must be _Signed_ by the stash, not the controller and
 *  it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  Emits `Bonded`.
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
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
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
 *  Effects will be felt at the beginning of the next era. This can only be called when
 *  [`EraElectionStatus`] is `Closed`.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - The transaction's complexity is proportional to the size of `targets`,
 *  which is capped at CompactAssignments::LIMIT.
 *  - Both the reads and writes follow a similar pattern.
 *  # </weight>
 */
export interface StakingCall_nominate {
    __kind: 'nominate'
    targets: LookupSource[],
}

/**
 *  **This extrinsic will be removed after `MigrationEra + HistoryDepth` has passed, giving
 *  opportunity for users to claim all rewards before moving to Simple Payouts. After this
 *  time, you should use `payout_stakers` instead.**
 * 
 *  Make one nominator's payout for one era.
 * 
 *  - `who` is the controller account of the nominator to pay out.
 *  - `era` may not be lower than one following the most recently paid era. If it is higher,
 *    then it indicates an instruction to skip the payout of all previous eras.
 *  - `validators` is the list of all validators that `who` had exposure to during `era`,
 *    alongside the index of `who` in the clipped exposure of the validator.
 *    I.e. each element is a tuple of
 *    `(validator, index of `who` in clipped exposure of validator)`.
 *    If it is incomplete, then less than the full reward will be paid out.
 *    It must not exceed `MAX_NOMINATIONS`.
 * 
 *  WARNING: once an era is payed for a validator such validator can't claim the payout of
 *  previous era.
 * 
 *  WARNING: Incorrect arguments here can result in loss of payout. Be very careful.
 * 
 *  # <weight>
 *  - Number of storage read of `O(validators)`; `validators` is the argument of the call,
 *    and is bounded by `MAX_NOMINATIONS`.
 *  - Each storage read is `O(N)` size and decode complexity; `N` is the  maximum
 *    nominations that can be given to a single validator.
 *  - Computation complexity: `O(MAX_NOMINATIONS * logN)`; `MAX_NOMINATIONS` is the
 *    maximum number of validators that may be nominated by a single nominator, it is
 *    bounded only economically (all nominators are required to place a minimum stake).
 *  # </weight>
 */
export interface StakingCall_payout_nominator {
    __kind: 'payout_nominator'
    era: EraIndex,
    validators: [AccountId, number][],
}

/**
 *  Pay out all the stakers behind a single validator for a single era.
 * 
 *  - `validator_stash` is the stash account of the validator. Their nominators, up to
 *    `T::MaxNominatorRewardedPerValidator`, will also receive their rewards.
 *  - `era` may be any era between `[current_era - history_depth; current_era]`.
 * 
 *  The origin of this call must be _Signed_. Any account can call this function, even if
 *  it is not one of the stakers.
 * 
 *  This can only be called when [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - Time complexity: at most O(MaxNominatorRewardedPerValidator).
 *  - Contains a limited number of reads and writes.
 *  # </weight>
 */
export interface StakingCall_payout_stakers {
    __kind: 'payout_stakers'
    validatorStash: AccountId,
    era: EraIndex,
}

/**
 *  **This extrinsic will be removed after `MigrationEra + HistoryDepth` has passed, giving
 *  opportunity for users to claim all rewards before moving to Simple Payouts. After this
 *  time, you should use `payout_stakers` instead.**
 * 
 *  Make one validator's payout for one era.
 * 
 *  - `who` is the controller account of the validator to pay out.
 *  - `era` may not be lower than one following the most recently paid era. If it is higher,
 *    then it indicates an instruction to skip the payout of all previous eras.
 * 
 *  WARNING: once an era is payed for a validator such validator can't claim the payout of
 *  previous era.
 * 
 *  WARNING: Incorrect arguments here can result in loss of payout. Be very careful.
 * 
 *  # <weight>
 *  - Time complexity: O(1).
 *  - Contains a limited number of reads and writes.
 *  # </weight>
 */
export interface StakingCall_payout_validator {
    __kind: 'payout_validator'
    era: EraIndex,
}

/**
 *  Remove all data structure concerning a staker/stash once its balance is zero.
 *  This is essentially equivalent to `withdraw_unbonded` except it can be called by anyone
 *  and the target `stash` must have no funds left.
 * 
 *  This can be called from any origin.
 * 
 *  - `stash`: The stash account to reap. Its balance must be zero.
 */
export interface StakingCall_reap_stash {
    __kind: 'reap_stash'
    stash: AccountId,
}

/**
 *  Rebond a portion of the stash scheduled to be unlocked.
 * 
 *  The dispatch origin must be signed by the controller, and it can be only called when
 *  [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - Time complexity: O(1). Bounded by `MAX_UNLOCKING_CHUNKS`.
 *  - Storage changes: Can't increase storage, only decrease it.
 *  # </weight>
 */
export interface StakingCall_rebond {
    __kind: 'rebond'
    value: bigint,
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
 *  Set history_depth value.
 * 
 *  Origin must be root.
 */
export interface StakingCall_set_history_depth {
    __kind: 'set_history_depth'
    newHistoryDepth: number,
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
 *  Submit a phragmen result to the chain. If the solution:
 * 
 *  1. is valid.
 *  2. has a better score than a potentially existing solution on chain.
 * 
 *  then, it will be _put_ on chain.
 * 
 *  A solution consists of two pieces of data:
 * 
 *  1. `winners`: a flat vector of all the winners of the round.
 *  2. `assignments`: the compact version of an assignment vector that encodes the edge
 *     weights.
 * 
 *  Both of which may be computed using [`phragmen`], or any other algorithm.
 * 
 *  Additionally, the submitter must provide:
 * 
 *  - The `score` that they claim their solution has.
 * 
 *  Both validators and nominators will be represented by indices in the solution. The
 *  indices should respect the corresponding types ([`ValidatorIndex`] and
 *  [`NominatorIndex`]). Moreover, they should be valid when used to index into
 *  [`SnapshotValidators`] and [`SnapshotNominators`]. Any invalid index will cause the
 *  solution to be rejected. These two storage items are set during the election window and
 *  may be used to determine the indices.
 * 
 *  A solution is valid if:
 * 
 *  0. It is submitted when [`EraElectionStatus`] is `Open`.
 *  1. Its claimed score is equal to the score computed on-chain.
 *  2. Presents the correct number of winners.
 *  3. All indexes must be value according to the snapshot vectors. All edge values must
 *     also be correct and should not overflow the granularity of the ratio type (i.e. 256
 *     or billion).
 *  4. For each edge, all targets are actually nominated by the voter.
 *  5. Has correct self-votes.
 * 
 *  A solutions score is consisted of 3 parameters:
 * 
 *  1. `min { support.total }` for each support of a winner. This value should be maximized.
 *  2. `sum { support.total }` for each support of a winner. This value should be minimized.
 *  3. `sum { support.total^2 }` for each support of a winner. This value should be
 *     minimized (to ensure less variance)
 * 
 *  # <weight>
 *  E: number of edges. m: size of winner committee. n: number of nominators. d: edge degree
 *  (16 for now) v: number of on-chain validator candidates.
 * 
 *  NOTE: given a solution which is reduced, we can enable a new check the ensure `|E| < n +
 *  m`. We don't do this _yet_, but our offchain worker code executes it nonetheless.
 * 
 *  major steps (all done in `check_and_replace_solution`):
 * 
 *  - Storage: O(1) read `ElectionStatus`.
 *  - Storage: O(1) read `PhragmenScore`.
 *  - Storage: O(1) read `ValidatorCount`.
 *  - Storage: O(1) length read from `SnapshotValidators`.
 * 
 *  - Storage: O(v) reads of `AccountId` to fetch `snapshot_validators`.
 *  - Memory: O(m) iterations to map winner index to validator id.
 *  - Storage: O(n) reads `AccountId` to fetch `snapshot_nominators`.
 *  - Memory: O(n + m) reads to map index to `AccountId` for un-compact.
 * 
 *  - Storage: O(e) accountid reads from `Nomination` to read correct nominations.
 *  - Storage: O(e) calls into `slashable_balance_of_vote_weight` to convert ratio to staked.
 * 
 *  - Memory: build_support_map. O(e).
 *  - Memory: evaluate_support: O(E).
 * 
 *  - Storage: O(e) writes to `QueuedElected`.
 *  - Storage: O(1) write to `QueuedScore`
 * 
 *  The weight of this call is 1/10th of the blocks total weight.
 *  # </weight>
 */
export interface StakingCall_submit_election_solution {
    __kind: 'submit_election_solution'
    winners: ValidatorIndex[],
    compactAssignments: CompactAssignments,
    score: PhragmenScore,
    era: EraIndex,
}

/**
 *  Unsigned version of `submit_election_solution`.
 * 
 *  Note that this must pass the [`ValidateUnsigned`] check which only allows transactions
 *  from the local node to be included. In other words, only the block author can include a
 *  transaction in the block.
 */
export interface StakingCall_submit_election_solution_unsigned {
    __kind: 'submit_election_solution_unsigned'
    winners: ValidatorIndex[],
    compactAssignments: CompactAssignments,
    score: PhragmenScore,
    era: EraIndex,
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
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  Emits `Unbonded`.
 * 
 *  See also [`Call::withdraw_unbonded`].
 * 
 *  # <weight>
 *  - Independent of the arguments. Limited but potentially exploitable complexity.
 *  - Contains a limited number of reads.
 *  - Each call (requires the remainder of the bonded balance to be above `minimum_balance`)
 *    will cause a new entry to be inserted into a vector (`Ledger.unlocking`) kept in storage.
 *    The only way to clean the aforementioned storage item is also user-controlled via
 *    `withdraw_unbonded`.
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
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
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
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  Emits `Withdrawn`.
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
        payout_nominator: sts.enumStruct({
            era: EraIndex,
            validators: sts.array(() => sts.tuple(() => AccountId, sts.number())),
        }),
        payout_stakers: sts.enumStruct({
            validatorStash: AccountId,
            era: EraIndex,
        }),
        payout_validator: sts.enumStruct({
            era: EraIndex,
        }),
        reap_stash: sts.enumStruct({
            stash: AccountId,
        }),
        rebond: sts.enumStruct({
            value: sts.bigint(),
        }),
        set_controller: sts.enumStruct({
            controller: LookupSource,
        }),
        set_history_depth: sts.enumStruct({
            newHistoryDepth: sts.number(),
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
        submit_election_solution: sts.enumStruct({
            winners: sts.array(() => ValidatorIndex),
            compactAssignments: CompactAssignments,
            score: PhragmenScore,
            era: EraIndex,
        }),
        submit_election_solution_unsigned: sts.enumStruct({
            winners: sts.array(() => ValidatorIndex),
            compactAssignments: CompactAssignments,
            score: PhragmenScore,
            era: EraIndex,
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

export type SocietyCall = SocietyCall_bid | SocietyCall_defender_vote | SocietyCall_found | SocietyCall_judge_suspended_candidate | SocietyCall_judge_suspended_member | SocietyCall_payout | SocietyCall_set_max_members | SocietyCall_unbid | SocietyCall_unfound | SocietyCall_unvouch | SocietyCall_vote | SocietyCall_vouch

/**
 *  A user outside of the society can make a bid for entry.
 * 
 *  Payment: `CandidateDeposit` will be reserved for making a bid. It is returned
 *  when the bid becomes a member, or if the bid calls `unbid`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `value`: A one time payment the bid would like to receive when joining the society.
 * 
 *  # <weight>
 *  Key: B (len of bids), C (len of candidates), M (len of members), X (balance reserve)
 *  - Storage Reads:
 *  	- One storage read to check for suspended candidate. O(1)
 *  	- One storage read to check for suspended member. O(1)
 *  	- One storage read to retrieve all current bids. O(B)
 *  	- One storage read to retrieve all current candidates. O(C)
 *  	- One storage read to retrieve all members. O(M)
 *  - Storage Writes:
 *  	- One storage mutate to add a new bid to the vector O(B) (TODO: possible optimization w/ read)
 *  	- Up to one storage removal if bid.len() > MAX_BID_COUNT. O(1)
 *  - Notable Computation:
 *  	- O(B + C + log M) search to check user is not already a part of society.
 *  	- O(log B) search to insert the new bid sorted.
 *  - External Module Operations:
 *  	- One balance reserve operation. O(X)
 *  	- Up to one balance unreserve operation if bids.len() > MAX_BID_COUNT.
 *  - Events:
 *  	- One event for new bid.
 *  	- Up to one event for AutoUnbid if bid.len() > MAX_BID_COUNT.
 * 
 *  Total Complexity: O(M + B + C + logM + logB + X)
 *  # </weight>
 */
export interface SocietyCall_bid {
    __kind: 'bid'
    value: BalanceOf,
}

/**
 *  As a member, vote on the defender.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `approve`: A boolean which says if the candidate should be
 *  approved (`true`) or rejected (`false`).
 * 
 *  # <weight>
 *  - Key: M (len of members)
 *  - One storage read O(M) and O(log M) search to check user is a member.
 *  - One storage write to add vote to votes. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(M + logM)
 *  # </weight>
 */
export interface SocietyCall_defender_vote {
    __kind: 'defender_vote'
    approve: boolean,
}

/**
 *  Found the society.
 * 
 *  This is done as a discrete action in order to allow for the
 *  module to be included into a running chain and can only be done once.
 * 
 *  The dispatch origin for this call must be from the _FounderSetOrigin_.
 * 
 *  Parameters:
 *  - `founder` - The first member and head of the newly founded society.
 *  - `max_members` - The initial max number of members for the society.
 *  - `rules` - The rules of this society concerning membership.
 * 
 *  # <weight>
 *  - Two storage mutates to set `Head` and `Founder`. O(1)
 *  - One storage write to add the first member to society. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export interface SocietyCall_found {
    __kind: 'found'
    founder: AccountId,
    maxMembers: number,
    rules: Bytes,
}

/**
 *  Allow suspended judgement origin to make judgement on a suspended candidate.
 * 
 *  If the judgement is `Approve`, we add them to society as a member with the appropriate
 *  payment for joining society.
 * 
 *  If the judgement is `Reject`, we either slash the deposit of the bid, giving it back
 *  to the society treasury, or we ban the voucher from vouching again.
 * 
 *  If the judgement is `Rebid`, we put the candidate back in the bid pool and let them go
 *  through the induction process again.
 * 
 *  The dispatch origin for this call must be from the _SuspensionJudgementOrigin_.
 * 
 *  Parameters:
 *  - `who` - The suspended candidate to be judged.
 *  - `judgement` - `Approve`, `Reject`, or `Rebid`.
 * 
 *  # <weight>
 *  Key: B (len of bids), M (len of members), X (balance action)
 *  - One storage read to check `who` is a suspended candidate.
 *  - One storage removal of the suspended candidate.
 *  - Approve Logic
 *  	- One storage read to get the available pot to pay users with. O(1)
 *  	- One storage write to update the available pot. O(1)
 *  	- One storage read to get the current block number. O(1)
 *  	- One storage read to get all members. O(M)
 *  	- Up to one unreserve currency action.
 *  	- Up to two new storage writes to payouts.
 *  	- Up to one storage write with O(log M) binary search to add a member to society.
 *  - Reject Logic
 *  	- Up to one repatriate reserved currency action. O(X)
 *  	- Up to one storage write to ban the vouching member from vouching again.
 *  - Rebid Logic
 *  	- Storage mutate with O(log B) binary search to place the user back into bids.
 *  - Up to one additional event if unvouch takes place.
 *  - One storage removal.
 *  - One event for the judgement.
 * 
 *  Total Complexity: O(M + logM + B + X)
 *  # </weight>
 */
export interface SocietyCall_judge_suspended_candidate {
    __kind: 'judge_suspended_candidate'
    who: AccountId,
    judgement: SocietyJudgement,
}

/**
 *  Allow suspension judgement origin to make judgement on a suspended member.
 * 
 *  If a suspended member is forgiven, we simply add them back as a member, not affecting
 *  any of the existing storage items for that member.
 * 
 *  If a suspended member is rejected, remove all associated storage items, including
 *  their payouts, and remove any vouched bids they currently have.
 * 
 *  The dispatch origin for this call must be from the _SuspensionJudgementOrigin_.
 * 
 *  Parameters:
 *  - `who` - The suspended member to be judged.
 *  - `forgive` - A boolean representing whether the suspension judgement origin
 *                forgives (`true`) or rejects (`false`) a suspended member.
 * 
 *  # <weight>
 *  Key: B (len of bids), M (len of members)
 *  - One storage read to check `who` is a suspended member. O(1)
 *  - Up to one storage write O(M) with O(log M) binary search to add a member back to society.
 *  - Up to 3 storage removals O(1) to clean up a removed member.
 *  - Up to one storage write O(B) with O(B) search to remove vouched bid from bids.
 *  - Up to one additional event if unvouch takes place.
 *  - One storage removal. O(1)
 *  - One event for the judgement.
 * 
 *  Total Complexity: O(M + logM + B)
 *  # </weight>
 */
export interface SocietyCall_judge_suspended_member {
    __kind: 'judge_suspended_member'
    who: AccountId,
    forgive: boolean,
}

/**
 *  Transfer the first matured payout for the sender and remove it from the records.
 * 
 *  NOTE: This extrinsic needs to be called multiple times to claim multiple matured payouts.
 * 
 *  Payment: The member will receive a payment equal to their first matured
 *  payout to their free balance.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member with
 *  payouts remaining.
 * 
 *  # <weight>
 *  Key: M (len of members), P (number of payouts for a particular member)
 *  - One storage read O(M) and O(log M) search to check signer is a member.
 *  - One storage read O(P) to get all payouts for a member.
 *  - One storage read O(1) to get the current block number.
 *  - One currency transfer call. O(X)
 *  - One storage write or removal to update the member's payouts. O(P)
 * 
 *  Total Complexity: O(M + logM + P + X)
 *  # </weight>
 */
export interface SocietyCall_payout {
    __kind: 'payout'
}

/**
 *  Allows root origin to change the maximum number of members in society.
 *  Max membership count must be greater than 1.
 * 
 *  The dispatch origin for this call must be from _ROOT_.
 * 
 *  Parameters:
 *  - `max` - The maximum number of members for the society.
 * 
 *  # <weight>
 *  - One storage write to update the max. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export interface SocietyCall_set_max_members {
    __kind: 'set_max_members'
    max: number,
}

/**
 *  A bidder can remove their bid for entry into society.
 *  By doing so, they will have their candidate deposit returned or
 *  they will unvouch their voucher.
 * 
 *  Payment: The bid deposit is unreserved if the user made a bid.
 * 
 *  The dispatch origin for this call must be _Signed_ and a bidder.
 * 
 *  Parameters:
 *  - `pos`: Position in the `Bids` vector of the bid who wants to unbid.
 * 
 *  # <weight>
 *  Key: B (len of bids), X (balance unreserve)
 *  - One storage read and write to retrieve and update the bids. O(B)
 *  - Either one unreserve balance action O(X) or one vouching storage removal. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(B + X)
 *  # </weight>
 */
export interface SocietyCall_unbid {
    __kind: 'unbid'
    pos: number,
}

/**
 *  Annul the founding of the society.
 * 
 *  The dispatch origin for this call must be Signed, and the signing account must be both
 *  the `Founder` and the `Head`. This implies that it may only be done when there is one
 *  member.
 * 
 *  # <weight>
 *  - Two storage reads O(1).
 *  - Four storage removals O(1).
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export interface SocietyCall_unfound {
    __kind: 'unfound'
}

/**
 *  As a vouching member, unvouch a bid. This only works while vouched user is
 *  only a bidder (and not a candidate).
 * 
 *  The dispatch origin for this call must be _Signed_ and a vouching member.
 * 
 *  Parameters:
 *  - `pos`: Position in the `Bids` vector of the bid who should be unvouched.
 * 
 *  # <weight>
 *  Key: B (len of bids)
 *  - One storage read O(1) to check the signer is a vouching member.
 *  - One storage mutate to retrieve and update the bids. O(B)
 *  - One vouching storage removal. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(B)
 *  # </weight>
 */
export interface SocietyCall_unvouch {
    __kind: 'unvouch'
    pos: number,
}

/**
 *  As a member, vote on a candidate.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `candidate`: The candidate that the member would like to bid on.
 *  - `approve`: A boolean which says if the candidate should be
 *               approved (`true`) or rejected (`false`).
 * 
 *  # <weight>
 *  Key: C (len of candidates), M (len of members)
 *  - One storage read O(M) and O(log M) search to check user is a member.
 *  - One account lookup.
 *  - One storage read O(C) and O(C) search to check that user is a candidate.
 *  - One storage write to add vote to votes. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(M + logM + C)
 *  # </weight>
 */
export interface SocietyCall_vote {
    __kind: 'vote'
    candidate: LookupSource,
    approve: boolean,
}

/**
 *  As a member, vouch for someone to join society by placing a bid on their behalf.
 * 
 *  There is no deposit required to vouch for a new bid, but a member can only vouch for
 *  one bid at a time. If the bid becomes a suspended candidate and ultimately rejected by
 *  the suspension judgement origin, the member will be banned from vouching again.
 * 
 *  As a vouching member, you can claim a tip if the candidate is accepted. This tip will
 *  be paid as a portion of the reward the member will receive for joining the society.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `who`: The user who you would like to vouch for.
 *  - `value`: The total reward to be paid between you and the candidate if they become
 *  a member in the society.
 *  - `tip`: Your cut of the total `value` payout when the candidate is inducted into
 *  the society. Tips larger than `value` will be saturated upon payout.
 * 
 *  # <weight>
 *  Key: B (len of bids), C (len of candidates), M (len of members)
 *  - Storage Reads:
 *  	- One storage read to retrieve all members. O(M)
 *  	- One storage read to check member is not already vouching. O(1)
 *  	- One storage read to check for suspended candidate. O(1)
 *  	- One storage read to check for suspended member. O(1)
 *  	- One storage read to retrieve all current bids. O(B)
 *  	- One storage read to retrieve all current candidates. O(C)
 *  - Storage Writes:
 *  	- One storage write to insert vouching status to the member. O(1)
 *  	- One storage mutate to add a new bid to the vector O(B) (TODO: possible optimization w/ read)
 *  	- Up to one storage removal if bid.len() > MAX_BID_COUNT. O(1)
 *  - Notable Computation:
 *  	- O(log M) search to check sender is a member.
 *  	- O(B + C + log M) search to check user is not already a part of society.
 *  	- O(log B) search to insert the new bid sorted.
 *  - External Module Operations:
 *  	- One balance reserve operation. O(X)
 *  	- Up to one balance unreserve operation if bids.len() > MAX_BID_COUNT.
 *  - Events:
 *  	- One event for vouch.
 *  	- Up to one event for AutoUnbid if bid.len() > MAX_BID_COUNT.
 * 
 *  Total Complexity: O(M + B + C + logM + logB + X)
 *  # </weight>
 */
export interface SocietyCall_vouch {
    __kind: 'vouch'
    who: AccountId,
    value: BalanceOf,
    tip: BalanceOf,
}

export const SocietyCall: sts.Type<SocietyCall> = sts.closedEnum(() => {
    return  {
        bid: sts.enumStruct({
            value: BalanceOf,
        }),
        defender_vote: sts.enumStruct({
            approve: sts.boolean(),
        }),
        found: sts.enumStruct({
            founder: AccountId,
            maxMembers: sts.number(),
            rules: sts.bytes(),
        }),
        judge_suspended_candidate: sts.enumStruct({
            who: AccountId,
            judgement: SocietyJudgement,
        }),
        judge_suspended_member: sts.enumStruct({
            who: AccountId,
            forgive: sts.boolean(),
        }),
        payout: sts.unit(),
        set_max_members: sts.enumStruct({
            max: sts.number(),
        }),
        unbid: sts.enumStruct({
            pos: sts.number(),
        }),
        unfound: sts.unit(),
        unvouch: sts.enumStruct({
            pos: sts.number(),
        }),
        vote: sts.enumStruct({
            candidate: LookupSource,
            approve: sts.boolean(),
        }),
        vouch: sts.enumStruct({
            who: AccountId,
            value: BalanceOf,
            tip: BalanceOf,
        }),
    }
})

export type SocietyJudgement = SocietyJudgement_Approve | SocietyJudgement_Rebid | SocietyJudgement_Reject

export interface SocietyJudgement_Approve {
    __kind: 'Approve'
}

export interface SocietyJudgement_Rebid {
    __kind: 'Rebid'
}

export interface SocietyJudgement_Reject {
    __kind: 'Reject'
}

export const SocietyJudgement: sts.Type<SocietyJudgement> = sts.closedEnum(() => {
    return  {
        Approve: sts.unit(),
        Rebid: sts.unit(),
        Reject: sts.unit(),
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
    code: ValidationCode,
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
    codeSize: number,
    initialHeadData: HeadData,
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
            code: ValidationCode,
        }),
        fix_deploy_data: sts.enumStruct({
            sub: sts.number(),
            paraId: sts.number(),
            codeHash: Hash,
            codeSize: sts.number(),
            initialHeadData: HeadData,
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

export type HeadData = Bytes

export const HeadData: sts.Type<HeadData> = sts.bytes()

export type ValidationCode = Bytes

export const ValidationCode: sts.Type<ValidationCode> = sts.bytes()

export type SessionCall = SessionCall_purge_keys | SessionCall_set_keys

/**
 *  Removes any session key(s) of the function caller.
 *  This doesn't take effect until the next session.
 * 
 *  The dispatch origin of this function must be signed.
 * 
 *  # <weight>
 *  - O(N) in number of key types.
 *  - Removes N + 1 DB entries.
 *  - Reduces system account refs by one on success.
 *  # </weight>
 */
export interface SessionCall_purge_keys {
    __kind: 'purge_keys'
}

/**
 *  Sets the session key(s) of the function caller to `keys`.
 *  Allows an account to set its session key prior to becoming a validator.
 *  This doesn't take effect until the next session.
 * 
 *  The dispatch origin of this function must be signed.
 * 
 *  # <weight>
 *  - O(log n) in number of accounts.
 *  - One extra DB entry.
 *  - Increases system account refs by one on success iff there were previously no keys set.
 *    In this case, purge_keys will need to be called before the account can be removed.
 *  # </weight>
 */
export interface SessionCall_set_keys {
    __kind: 'set_keys'
    keys: Keys,
    proof: Bytes,
}

export const SessionCall: sts.Type<SessionCall> = sts.closedEnum(() => {
    return  {
        purge_keys: sts.unit(),
        set_keys: sts.enumStruct({
            keys: Keys,
            proof: sts.bytes(),
        }),
    }
})

export type Keys = [AccountId, AccountId, AccountId, AccountId, AccountId]

export const Keys: sts.Type<Keys> = sts.tuple(() => AccountId, AccountId, AccountId, AccountId, AccountId)

export type SchedulerCall = never

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
 *  Register a parachain with given code. Must be called by root.
 *  Fails if given ID is already used.
 * 
 *  Unlike the `Registrar` trait function of the same name, this
 *  checks the code and head data against size limits.
 */
export interface RegistrarCall_register_para {
    __kind: 'register_para'
    id: number,
    info: ParaInfo,
    code: ValidationCode,
    initialHeadData: HeadData,
}

/**
 *  Register a parathread for immediate use.
 * 
 *  Must be sent from a Signed origin that is able to have ParathreadDeposit reserved.
 *  `code` and `initial_head_data` are used to initialize the parathread's state.
 * 
 *  Unlike `register_para`, this function does check that the maximum code size
 *  and head data size are respected, as parathread registration is an atomic
 *  action.
 */
export interface RegistrarCall_register_parathread {
    __kind: 'register_parathread'
    code: ValidationCode,
    initialHeadData: HeadData,
}

/**
 *  Place a bid for a parathread to be progressed in the next block.
 * 
 *  This is a kind of special transaction that should be heavily prioritized in the
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
            code: ValidationCode,
            initialHeadData: HeadData,
        }),
        register_parathread: sts.enumStruct({
            code: ValidationCode,
            initialHeadData: HeadData,
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

export type RecoveryCall = RecoveryCall_as_recovered | RecoveryCall_cancel_recovered | RecoveryCall_claim_recovery | RecoveryCall_close_recovery | RecoveryCall_create_recovery | RecoveryCall_initiate_recovery | RecoveryCall_remove_recovery | RecoveryCall_set_recovered | RecoveryCall_vouch_recovery

/**
 *  Send a call through a recovered account.
 * 
 *  The dispatch origin for this call must be _Signed_ and registered to
 *  be able to make calls on behalf of the recovered account.
 * 
 *  Parameters:
 *  - `account`: The recovered account you want to make a call on-behalf-of.
 *  - `call`: The call you want to make with the recovered account.
 * 
 *  # <weight>
 *  - The weight of the `call` + 10,000.
 *  - One storage lookup to check account is recovered by `who`. O(1)
 *  # </weight>
 */
export interface RecoveryCall_as_recovered {
    __kind: 'as_recovered'
    account: AccountId,
    call: Type_176,
}

/**
 *  Cancel the ability to use `as_recovered` for `account`.
 * 
 *  The dispatch origin for this call must be _Signed_ and registered to
 *  be able to make calls on behalf of the recovered account.
 * 
 *  Parameters:
 *  - `account`: The recovered account you are able to call on-behalf-of.
 * 
 *  # <weight>
 *  - One storage mutation to check account is recovered by `who`. O(1)
 *  # </weight>
 */
export interface RecoveryCall_cancel_recovered {
    __kind: 'cancel_recovered'
    account: AccountId,
}

/**
 *  Allow a successful rescuer to claim their recovered account.
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a "rescuer"
 *  who has successfully completed the account recovery process: collected
 *  `threshold` or more vouches, waited `delay_period` blocks since initiation.
 * 
 *  Parameters:
 *  - `account`: The lost account that you want to claim has been successfully
 *    recovered by you.
 * 
 *  # <weight>
 *  Key: F (len of friends in config), V (len of vouching friends)
 *  - One storage read to get the recovery configuration. O(1), Codec O(F)
 *  - One storage read to get the active recovery process. O(1), Codec O(V)
 *  - One storage read to get the current block number. O(1)
 *  - One storage write. O(1), Codec O(V).
 *  - One event.
 * 
 *  Total Complexity: O(F + V)
 *  # </weight>
 */
export interface RecoveryCall_claim_recovery {
    __kind: 'claim_recovery'
    account: AccountId,
}

/**
 *  As the controller of a recoverable account, close an active recovery
 *  process for your account.
 * 
 *  Payment: By calling this function, the recoverable account will receive
 *  the recovery deposit `RecoveryDeposit` placed by the rescuer.
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a
 *  recoverable account with an active recovery process for it.
 * 
 *  Parameters:
 *  - `rescuer`: The account trying to rescue this recoverable account.
 * 
 *  # <weight>
 *  Key: V (len of vouching friends)
 *  - One storage read/remove to get the active recovery process. O(1), Codec O(V)
 *  - One balance call to repatriate reserved. O(X)
 *  - One event.
 * 
 *  Total Complexity: O(V + X)
 *  # </weight>
 */
export interface RecoveryCall_close_recovery {
    __kind: 'close_recovery'
    rescuer: AccountId,
}

/**
 *  Create a recovery configuration for your account. This makes your account recoverable.
 * 
 *  Payment: `ConfigDepositBase` + `FriendDepositFactor` * #_of_friends balance
 *  will be reserved for storing the recovery configuration. This deposit is returned
 *  in full when the user calls `remove_recovery`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `friends`: A list of friends you trust to vouch for recovery attempts.
 *    Should be ordered and contain no duplicate values.
 *  - `threshold`: The number of friends that must vouch for a recovery attempt
 *    before the account can be recovered. Should be less than or equal to
 *    the length of the list of friends.
 *  - `delay_period`: The number of blocks after a recovery attempt is initialized
 *    that needs to pass before the account can be recovered.
 * 
 *  # <weight>
 *  - Key: F (len of friends)
 *  - One storage read to check that account is not already recoverable. O(1).
 *  - A check that the friends list is sorted and unique. O(F)
 *  - One currency reserve operation. O(X)
 *  - One storage write. O(1). Codec O(F).
 *  - One event.
 * 
 *  Total Complexity: O(F + X)
 *  # </weight>
 */
export interface RecoveryCall_create_recovery {
    __kind: 'create_recovery'
    friends: AccountId[],
    threshold: number,
    delayPeriod: BlockNumber,
}

/**
 *  Initiate the process for recovering a recoverable account.
 * 
 *  Payment: `RecoveryDeposit` balance will be reserved for initiating the
 *  recovery process. This deposit will always be repatriated to the account
 *  trying to be recovered. See `close_recovery`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `account`: The lost account that you want to recover. This account
 *    needs to be recoverable (i.e. have a recovery configuration).
 * 
 *  # <weight>
 *  - One storage read to check that account is recoverable. O(F)
 *  - One storage read to check that this recovery process hasn't already started. O(1)
 *  - One currency reserve operation. O(X)
 *  - One storage read to get the current block number. O(1)
 *  - One storage write. O(1).
 *  - One event.
 * 
 *  Total Complexity: O(F + X)
 *  # </weight>
 */
export interface RecoveryCall_initiate_recovery {
    __kind: 'initiate_recovery'
    account: AccountId,
}

/**
 *  Remove the recovery process for your account. Recovered accounts are still accessible.
 * 
 *  NOTE: The user must make sure to call `close_recovery` on all active
 *  recovery attempts before calling this function else it will fail.
 * 
 *  Payment: By calling this function the recoverable account will unreserve
 *  their recovery configuration deposit.
 *  (`ConfigDepositBase` + `FriendDepositFactor` * #_of_friends)
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a
 *  recoverable account (i.e. has a recovery configuration).
 * 
 *  # <weight>
 *  Key: F (len of friends)
 *  - One storage read to get the prefix iterator for active recoveries. O(1)
 *  - One storage read/remove to get the recovery configuration. O(1), Codec O(F)
 *  - One balance call to unreserved. O(X)
 *  - One event.
 * 
 *  Total Complexity: O(F + X)
 *  # </weight>
 */
export interface RecoveryCall_remove_recovery {
    __kind: 'remove_recovery'
}

/**
 *  Allow ROOT to bypass the recovery process and set an a rescuer account
 *  for a lost account directly.
 * 
 *  The dispatch origin for this call must be _ROOT_.
 * 
 *  Parameters:
 *  - `lost`: The "lost account" to be recovered.
 *  - `rescuer`: The "rescuer account" which can call as the lost account.
 * 
 *  # <weight>
 *  - One storage write O(1)
 *  - One event
 *  # </weight>
 */
export interface RecoveryCall_set_recovered {
    __kind: 'set_recovered'
    lost: AccountId,
    rescuer: AccountId,
}

/**
 *  Allow a "friend" of a recoverable account to vouch for an active recovery
 *  process for that account.
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a "friend"
 *  for the recoverable account.
 * 
 *  Parameters:
 *  - `lost`: The lost account that you want to recover.
 *  - `rescuer`: The account trying to rescue the lost account that you
 *    want to vouch for.
 * 
 *  The combination of these two parameters must point to an active recovery
 *  process.
 * 
 *  # <weight>
 *  Key: F (len of friends in config), V (len of vouching friends)
 *  - One storage read to get the recovery configuration. O(1), Codec O(F)
 *  - One storage read to get the active recovery process. O(1), Codec O(V)
 *  - One binary search to confirm caller is a friend. O(logF)
 *  - One binary search to confirm caller has not already vouched. O(logV)
 *  - One storage write. O(1), Codec O(V).
 *  - One event.
 * 
 *  Total Complexity: O(F + logF + V + logV)
 *  # </weight>
 */
export interface RecoveryCall_vouch_recovery {
    __kind: 'vouch_recovery'
    lost: AccountId,
    rescuer: AccountId,
}

export const RecoveryCall: sts.Type<RecoveryCall> = sts.closedEnum(() => {
    return  {
        as_recovered: sts.enumStruct({
            account: AccountId,
            call: Type_176,
        }),
        cancel_recovered: sts.enumStruct({
            account: AccountId,
        }),
        claim_recovery: sts.enumStruct({
            account: AccountId,
        }),
        close_recovery: sts.enumStruct({
            rescuer: AccountId,
        }),
        create_recovery: sts.enumStruct({
            friends: sts.array(() => AccountId),
            threshold: sts.number(),
            delayPeriod: BlockNumber,
        }),
        initiate_recovery: sts.enumStruct({
            account: AccountId,
        }),
        remove_recovery: sts.unit(),
        set_recovered: sts.enumStruct({
            lost: AccountId,
            rescuer: AccountId,
        }),
        vouch_recovery: sts.enumStruct({
            lost: AccountId,
            rescuer: AccountId,
        }),
    }
})

export type ParachainsCall = ParachainsCall_report_double_vote | ParachainsCall_set_heads

/**
 *  Provide a proof that some validator has commited a double-vote.
 * 
 *  The weight is 0; in order to avoid DoS a `SignedExtension` validation
 *  is implemented.
 */
export interface ParachainsCall_report_double_vote {
    __kind: 'report_double_vote'
    report: DoubleVoteReport,
}

/**
 *  Provide candidate receipts for parachains, in ascending order by id.
 */
export interface ParachainsCall_set_heads {
    __kind: 'set_heads'
    heads: AttestedCandidate[],
}

export const ParachainsCall: sts.Type<ParachainsCall> = sts.closedEnum(() => {
    return  {
        report_double_vote: sts.enumStruct({
            report: DoubleVoteReport,
        }),
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

export type ParaId = number

export const ParaId: sts.Type<ParaId> = sts.number()

export type OffencesCall = never

export type IndicesCall = IndicesCall_claim | IndicesCall_force_transfer | IndicesCall_free | IndicesCall_transfer

/**
 *  Assign an previously unassigned index.
 * 
 *  Payment: `Deposit` is reserved from the sender account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `index`: the index to be claimed. This must not be in use.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - One reserve operation.
 *  - One event.
 *  # </weight>
 */
export interface IndicesCall_claim {
    __kind: 'claim'
    index: AccountIndex,
}

/**
 *  Force an index to an account. This doesn't require a deposit. If the index is already
 *  held, then any deposit is reimbursed to its current owner.
 * 
 *  The dispatch origin for this call must be _Root_.
 * 
 *  - `index`: the index to be (re-)assigned.
 *  - `new`: the new owner of the index. This function is a no-op if it is equal to sender.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - Up to one reserve operation.
 *  - One event.
 *  # </weight>
 */
export interface IndicesCall_force_transfer {
    __kind: 'force_transfer'
    new: AccountId,
    index: AccountIndex,
}

/**
 *  Free up an index owned by the sender.
 * 
 *  Payment: Any previous deposit placed for the index is unreserved in the sender account.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must own the index.
 * 
 *  - `index`: the index to be freed. This must be owned by the sender.
 * 
 *  Emits `IndexFreed` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - One reserve operation.
 *  - One event.
 *  # </weight>
 */
export interface IndicesCall_free {
    __kind: 'free'
    index: AccountIndex,
}

/**
 *  Assign an index already owned by the sender to another account. The balance reservation
 *  is effectively transferred to the new account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `index`: the index to be re-assigned. This must be owned by the sender.
 *  - `new`: the new owner of the index. This function is a no-op if it is equal to sender.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - One transfer operation.
 *  - One event.
 *  # </weight>
 */
export interface IndicesCall_transfer {
    __kind: 'transfer'
    new: AccountId,
    index: AccountIndex,
}

export const IndicesCall: sts.Type<IndicesCall> = sts.closedEnum(() => {
    return  {
        claim: sts.enumStruct({
            index: AccountIndex,
        }),
        force_transfer: sts.enumStruct({
            new: AccountId,
            index: AccountIndex,
        }),
        free: sts.enumStruct({
            index: AccountIndex,
        }),
        transfer: sts.enumStruct({
            new: AccountId,
            index: AccountIndex,
        }),
    }
})

export type AccountIndex = number

export const AccountIndex: sts.Type<AccountIndex> = sts.number()

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

export type IdentityCall = IdentityCall_add_registrar | IdentityCall_cancel_request | IdentityCall_clear_identity | IdentityCall_kill_identity | IdentityCall_provide_judgement | IdentityCall_request_judgement | IdentityCall_set_account_id | IdentityCall_set_fee | IdentityCall_set_fields | IdentityCall_set_identity | IdentityCall_set_subs

/**
 *  Add a registrar to the system.
 * 
 *  The dispatch origin for this call must be `RegistrarOrigin` or `Root`.
 * 
 *  - `account`: the account of the registrar.
 * 
 *  Emits `RegistrarAdded` if successful.
 * 
 *  # <weight>
 *  - `O(R)` where `R` registrar-count (governance-bounded).
 *  - One storage mutation (codec `O(R)`).
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_add_registrar {
    __kind: 'add_registrar'
    account: AccountId,
}

/**
 *  Cancel a previous request.
 * 
 *  Payment: A previously reserved deposit is returned on success.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a
 *  registered identity.
 * 
 *  - `reg_index`: The index of the registrar whose judgement is no longer requested.
 * 
 *  Emits `JudgementUnrequested` if successful.
 * 
 *  # <weight>
 *  - `O(R + X)`.
 *  - One balance-reserve operation.
 *  - One storage mutation `O(R + X)`.
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_cancel_request {
    __kind: 'cancel_request'
    regIndex: RegistrarIndex,
}

/**
 *  Clear an account's identity info and all sub-account and return all deposits.
 * 
 *  Payment: All reserved balances on the account are returned.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  identity.
 * 
 *  Emits `IdentityCleared` if successful.
 * 
 *  # <weight>
 *  - `O(R + S + X)`.
 *  - One balance-reserve operation.
 *  - `S + 2` storage deletions.
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_clear_identity {
    __kind: 'clear_identity'
}

/**
 *  Remove an account's identity and sub-account information and slash the deposits.
 * 
 *  Payment: Reserved balances from `set_subs` and `set_identity` are slashed and handled by
 *  `Slash`. Verification request deposits are not returned; they should be cancelled
 *  manually using `cancel_request`.
 * 
 *  The dispatch origin for this call must be _Root_ or match `T::ForceOrigin`.
 * 
 *  - `target`: the account whose identity the judgement is upon. This must be an account
 *    with a registered identity.
 * 
 *  Emits `IdentityKilled` if successful.
 * 
 *  # <weight>
 *  - `O(R + S + X)`.
 *  - One balance-reserve operation.
 *  - `S + 2` storage mutations.
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_kill_identity {
    __kind: 'kill_identity'
    target: LookupSource,
}

/**
 *  Provide a judgement for an account's identity.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `reg_index`.
 * 
 *  - `reg_index`: the index of the registrar whose judgement is being made.
 *  - `target`: the account whose identity the judgement is upon. This must be an account
 *    with a registered identity.
 *  - `judgement`: the judgement of the registrar of index `reg_index` about `target`.
 * 
 *  Emits `JudgementGiven` if successful.
 * 
 *  # <weight>
 *  - `O(R + X)`.
 *  - One balance-transfer operation.
 *  - Up to one account-lookup operation.
 *  - Storage: 1 read `O(R)`, 1 mutate `O(R + X)`.
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_provide_judgement {
    __kind: 'provide_judgement'
    regIndex: number,
    target: LookupSource,
    judgement: IdentityJudgement,
}

/**
 *  Request a judgement from a registrar.
 * 
 *  Payment: At most `max_fee` will be reserved for payment to the registrar if judgement
 *  given.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a
 *  registered identity.
 * 
 *  - `reg_index`: The index of the registrar whose judgement is requested.
 *  - `max_fee`: The maximum fee that may be paid. This should just be auto-populated as:
 * 
 *  ```nocompile
 *  Self::registrars(reg_index).unwrap().fee
 *  ```
 * 
 *  Emits `JudgementRequested` if successful.
 * 
 *  # <weight>
 *  - `O(R + X)`.
 *  - One balance-reserve operation.
 *  - Storage: 1 read `O(R)`, 1 mutate `O(X + R)`.
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_request_judgement {
    __kind: 'request_judgement'
    regIndex: number,
    maxFee: bigint,
}

/**
 *  Change the account associated with a registrar.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `index`.
 * 
 *  - `index`: the index of the registrar whose fee is to be set.
 *  - `new`: the new account ID.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - One storage mutation `O(R)`.
 *  # </weight>
 */
export interface IdentityCall_set_account_id {
    __kind: 'set_account_id'
    index: number,
    new: AccountId,
}

/**
 *  Set the fee required for a judgement to be requested from a registrar.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `index`.
 * 
 *  - `index`: the index of the registrar whose fee is to be set.
 *  - `fee`: the new fee.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - One storage mutation `O(R)`.
 *  # </weight>
 */
export interface IdentityCall_set_fee {
    __kind: 'set_fee'
    index: number,
    fee: bigint,
}

/**
 *  Set the field information for a registrar.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `index`.
 * 
 *  - `index`: the index of the registrar whose fee is to be set.
 *  - `fields`: the fields that the registrar concerns themselves with.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - One storage mutation `O(R)`.
 *  # </weight>
 */
export interface IdentityCall_set_fields {
    __kind: 'set_fields'
    index: number,
    fields: bigint,
}

/**
 *  Set an account's identity information and reserve the appropriate deposit.
 * 
 *  If the account already has identity information, the deposit is taken as part payment
 *  for the new deposit.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  identity.
 * 
 *  - `info`: The identity information.
 * 
 *  Emits `IdentitySet` if successful.
 * 
 *  # <weight>
 *  - `O(X + X' + R)` where `X` additional-field-count (deposit-bounded and code-bounded).
 *  - At most two balance operations.
 *  - One storage mutation (codec-read `O(X' + R)`, codec-write `O(X + R)`).
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_set_identity {
    __kind: 'set_identity'
    info: IdentityInfo,
}

/**
 *  Set the sub-accounts of the sender.
 * 
 *  Payment: Any aggregate balance reserved by previous `set_subs` calls will be returned
 *  and an amount `SubAccountDeposit` will be reserved for each item in `subs`.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  identity.
 * 
 *  - `subs`: The identity's sub-accounts.
 * 
 *  # <weight>
 *  - `O(S)` where `S` subs-count (hard- and deposit-bounded).
 *  - At most two balance operations.
 *  - At most O(2 * S + 1) storage mutations; codec complexity `O(1 * S + S * 1)`);
 *    one storage-exists.
 *  # </weight>
 */
export interface IdentityCall_set_subs {
    __kind: 'set_subs'
    subs: [AccountId, Data][],
}

export const IdentityCall: sts.Type<IdentityCall> = sts.closedEnum(() => {
    return  {
        add_registrar: sts.enumStruct({
            account: AccountId,
        }),
        cancel_request: sts.enumStruct({
            regIndex: RegistrarIndex,
        }),
        clear_identity: sts.unit(),
        kill_identity: sts.enumStruct({
            target: LookupSource,
        }),
        provide_judgement: sts.enumStruct({
            regIndex: sts.number(),
            target: LookupSource,
            judgement: IdentityJudgement,
        }),
        request_judgement: sts.enumStruct({
            regIndex: sts.number(),
            maxFee: sts.bigint(),
        }),
        set_account_id: sts.enumStruct({
            index: sts.number(),
            new: AccountId,
        }),
        set_fee: sts.enumStruct({
            index: sts.number(),
            fee: sts.bigint(),
        }),
        set_fields: sts.enumStruct({
            index: sts.number(),
            fields: sts.bigint(),
        }),
        set_identity: sts.enumStruct({
            info: IdentityInfo,
        }),
        set_subs: sts.enumStruct({
            subs: sts.array(() => sts.tuple(() => AccountId, Data)),
        }),
    }
})

export type Data = Data_BlakeTwo256 | Data_Keccak256 | Data_None | Data_Raw0 | Data_Raw1 | Data_Raw10 | Data_Raw11 | Data_Raw12 | Data_Raw13 | Data_Raw14 | Data_Raw15 | Data_Raw16 | Data_Raw17 | Data_Raw18 | Data_Raw19 | Data_Raw2 | Data_Raw20 | Data_Raw21 | Data_Raw22 | Data_Raw23 | Data_Raw24 | Data_Raw25 | Data_Raw26 | Data_Raw27 | Data_Raw28 | Data_Raw29 | Data_Raw3 | Data_Raw30 | Data_Raw31 | Data_Raw32 | Data_Raw4 | Data_Raw5 | Data_Raw6 | Data_Raw7 | Data_Raw8 | Data_Raw9 | Data_Sha256 | Data_ShaThree256

export interface Data_BlakeTwo256 {
    __kind: 'BlakeTwo256'
    value: H256
}

export interface Data_Keccak256 {
    __kind: 'Keccak256'
    value: H256
}

export interface Data_None {
    __kind: 'None'
}

export interface Data_Raw0 {
    __kind: 'Raw0'
    value: Bytes
}

export interface Data_Raw1 {
    __kind: 'Raw1'
    value: Bytes
}

export interface Data_Raw10 {
    __kind: 'Raw10'
    value: Bytes
}

export interface Data_Raw11 {
    __kind: 'Raw11'
    value: Bytes
}

export interface Data_Raw12 {
    __kind: 'Raw12'
    value: Bytes
}

export interface Data_Raw13 {
    __kind: 'Raw13'
    value: Bytes
}

export interface Data_Raw14 {
    __kind: 'Raw14'
    value: Bytes
}

export interface Data_Raw15 {
    __kind: 'Raw15'
    value: Bytes
}

export interface Data_Raw16 {
    __kind: 'Raw16'
    value: Bytes
}

export interface Data_Raw17 {
    __kind: 'Raw17'
    value: Bytes
}

export interface Data_Raw18 {
    __kind: 'Raw18'
    value: Bytes
}

export interface Data_Raw19 {
    __kind: 'Raw19'
    value: Bytes
}

export interface Data_Raw2 {
    __kind: 'Raw2'
    value: Bytes
}

export interface Data_Raw20 {
    __kind: 'Raw20'
    value: Bytes
}

export interface Data_Raw21 {
    __kind: 'Raw21'
    value: Bytes
}

export interface Data_Raw22 {
    __kind: 'Raw22'
    value: Bytes
}

export interface Data_Raw23 {
    __kind: 'Raw23'
    value: Bytes
}

export interface Data_Raw24 {
    __kind: 'Raw24'
    value: Bytes
}

export interface Data_Raw25 {
    __kind: 'Raw25'
    value: Bytes
}

export interface Data_Raw26 {
    __kind: 'Raw26'
    value: Bytes
}

export interface Data_Raw27 {
    __kind: 'Raw27'
    value: Bytes
}

export interface Data_Raw28 {
    __kind: 'Raw28'
    value: Bytes
}

export interface Data_Raw29 {
    __kind: 'Raw29'
    value: Bytes
}

export interface Data_Raw3 {
    __kind: 'Raw3'
    value: Bytes
}

export interface Data_Raw30 {
    __kind: 'Raw30'
    value: Bytes
}

export interface Data_Raw31 {
    __kind: 'Raw31'
    value: Bytes
}

export interface Data_Raw32 {
    __kind: 'Raw32'
    value: Bytes
}

export interface Data_Raw4 {
    __kind: 'Raw4'
    value: Bytes
}

export interface Data_Raw5 {
    __kind: 'Raw5'
    value: Bytes
}

export interface Data_Raw6 {
    __kind: 'Raw6'
    value: Bytes
}

export interface Data_Raw7 {
    __kind: 'Raw7'
    value: Bytes
}

export interface Data_Raw8 {
    __kind: 'Raw8'
    value: Bytes
}

export interface Data_Raw9 {
    __kind: 'Raw9'
    value: Bytes
}

export interface Data_Sha256 {
    __kind: 'Sha256'
    value: H256
}

export interface Data_ShaThree256 {
    __kind: 'ShaThree256'
    value: H256
}

export const Data: sts.Type<Data> = sts.closedEnum(() => {
    return  {
        BlakeTwo256: H256,
        Keccak256: H256,
        None: sts.unit(),
        Raw0: sts.bytes(),
        Raw1: sts.bytes(),
        Raw10: sts.bytes(),
        Raw11: sts.bytes(),
        Raw12: sts.bytes(),
        Raw13: sts.bytes(),
        Raw14: sts.bytes(),
        Raw15: sts.bytes(),
        Raw16: sts.bytes(),
        Raw17: sts.bytes(),
        Raw18: sts.bytes(),
        Raw19: sts.bytes(),
        Raw2: sts.bytes(),
        Raw20: sts.bytes(),
        Raw21: sts.bytes(),
        Raw22: sts.bytes(),
        Raw23: sts.bytes(),
        Raw24: sts.bytes(),
        Raw25: sts.bytes(),
        Raw26: sts.bytes(),
        Raw27: sts.bytes(),
        Raw28: sts.bytes(),
        Raw29: sts.bytes(),
        Raw3: sts.bytes(),
        Raw30: sts.bytes(),
        Raw31: sts.bytes(),
        Raw32: sts.bytes(),
        Raw4: sts.bytes(),
        Raw5: sts.bytes(),
        Raw6: sts.bytes(),
        Raw7: sts.bytes(),
        Raw8: sts.bytes(),
        Raw9: sts.bytes(),
        Sha256: H256,
        ShaThree256: H256,
    }
})

export type H256 = Bytes

export const H256: sts.Type<H256> = sts.bytes()

export type IdentityInfo = {
    additional: IdentityInfoAdditional[],
    display: Data,
    legal: Data,
    web: Data,
    riot: Data,
    email: Data,
    pgpFingerprint?: (H160 | undefined),
    image: Data,
    twitter: Data,
}

export const IdentityInfo: sts.Type<IdentityInfo> = sts.struct(() => {
    return  {
        additional: sts.array(() => IdentityInfoAdditional),
        display: Data,
        legal: Data,
        web: Data,
        riot: Data,
        email: Data,
        pgpFingerprint: sts.option(() => H160),
        image: Data,
        twitter: Data,
    }
})

export type H160 = Bytes

export const H160: sts.Type<H160> = sts.bytes()

export type IdentityInfoAdditional = [Data, Data]

export const IdentityInfoAdditional: sts.Type<IdentityInfoAdditional> = sts.tuple(() => Data, Data)

export type IdentityJudgement = IdentityJudgement_Erroneous | IdentityJudgement_FeePaid | IdentityJudgement_KnownGood | IdentityJudgement_LowQuality | IdentityJudgement_OutOfDate | IdentityJudgement_Reasonable | IdentityJudgement_Unknown

export interface IdentityJudgement_Erroneous {
    __kind: 'Erroneous'
}

export interface IdentityJudgement_FeePaid {
    __kind: 'FeePaid'
    value: Balance
}

export interface IdentityJudgement_KnownGood {
    __kind: 'KnownGood'
}

export interface IdentityJudgement_LowQuality {
    __kind: 'LowQuality'
}

export interface IdentityJudgement_OutOfDate {
    __kind: 'OutOfDate'
}

export interface IdentityJudgement_Reasonable {
    __kind: 'Reasonable'
}

export interface IdentityJudgement_Unknown {
    __kind: 'Unknown'
}

export const IdentityJudgement: sts.Type<IdentityJudgement> = sts.closedEnum(() => {
    return  {
        Erroneous: sts.unit(),
        FeePaid: Balance,
        KnownGood: sts.unit(),
        LowQuality: sts.unit(),
        OutOfDate: sts.unit(),
        Reasonable: sts.unit(),
        Unknown: sts.unit(),
    }
})

export type RegistrarIndex = number

export const RegistrarIndex: sts.Type<RegistrarIndex> = sts.number()

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

export type DemocracyCall = DemocracyCall_activate_proxy | DemocracyCall_cancel_queued | DemocracyCall_cancel_referendum | DemocracyCall_clear_public_proposals | DemocracyCall_close_proxy | DemocracyCall_deactivate_proxy | DemocracyCall_delegate | DemocracyCall_emergency_cancel | DemocracyCall_enact_proposal | DemocracyCall_external_propose | DemocracyCall_external_propose_default | DemocracyCall_external_propose_majority | DemocracyCall_fast_track | DemocracyCall_note_imminent_preimage | DemocracyCall_note_preimage | DemocracyCall_open_proxy | DemocracyCall_propose | DemocracyCall_proxy_delegate | DemocracyCall_proxy_remove_vote | DemocracyCall_proxy_undelegate | DemocracyCall_proxy_vote | DemocracyCall_reap_preimage | DemocracyCall_remove_other_vote | DemocracyCall_remove_vote | DemocracyCall_second | DemocracyCall_undelegate | DemocracyCall_unlock | DemocracyCall_veto_external | DemocracyCall_vote

/**
 *  Specify a proxy that is already open to us. Called by the stash.
 * 
 *  NOTE: Used to be called `set_proxy`.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `proxy`: The account that will be activated as proxy.
 * 
 *  # <weight>
 *  - One extra DB entry.
 *  # </weight>
 */
export interface DemocracyCall_activate_proxy {
    __kind: 'activate_proxy'
    proxy: AccountId,
}

/**
 *  Cancel a proposal queued for enactment.
 * 
 *  The dispatch origin of this call must be _Root_.
 * 
 *  - `which`: The index of the referendum to cancel.
 * 
 *  # <weight>
 *  - One DB change.
 *  - O(d) where d is the items in the dispatch queue.
 *  # </weight>
 */
export interface DemocracyCall_cancel_queued {
    __kind: 'cancel_queued'
    which: ReferendumIndex,
}

/**
 *  Remove a referendum.
 * 
 *  The dispatch origin of this call must be _Root_.
 * 
 *  - `ref_index`: The index of the referendum to cancel.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  # </weight>
 */
export interface DemocracyCall_cancel_referendum {
    __kind: 'cancel_referendum'
    refIndex: number,
}

/**
 *  Clears all public proposals.
 * 
 *  The dispatch origin of this call must be _Root_.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One DB clear.
 *  # </weight>
 */
export interface DemocracyCall_clear_public_proposals {
    __kind: 'clear_public_proposals'
}

/**
 *  Clear the proxy. Called by the proxy.
 * 
 *  NOTE: Used to be called `resign_proxy`.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  # <weight>
 *  - One DB clear.
 *  # </weight>
 */
export interface DemocracyCall_close_proxy {
    __kind: 'close_proxy'
}

/**
 *  Deactivate the proxy, but leave open to this account. Called by the stash.
 * 
 *  The proxy must already be active.
 * 
 *  NOTE: Used to be called `remove_proxy`.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `proxy`: The account that will be deactivated as proxy.
 * 
 *  # <weight>
 *  - One DB clear.
 *  # </weight>
 */
export interface DemocracyCall_deactivate_proxy {
    __kind: 'deactivate_proxy'
    proxy: AccountId,
}

/**
 *  Delegate the voting power (with some given conviction) of the sending account.
 * 
 *  The balance delegated is locked for as long as it's delegated, and thereafter for the
 *  time appropriate for the conviction's lock period.
 * 
 *  The dispatch origin of this call must be _Signed_, and the signing account must either:
 *    - be delegating already; or
 *    - have no voting activity (if there is, then it will need to be removed/consolidated
 *      through `reap_vote` or `unvote`).
 * 
 *  - `to`: The account whose voting the `target` account's voting power will follow.
 *  - `conviction`: The conviction that will be attached to the delegated votes. When the
 *    account is undelegated, the funds will be locked for the corresponding period.
 *  - `balance`: The amount of the account's balance to be used in delegating. This must
 *    not be more than the account's current balance.
 * 
 *  Emits `Delegated`.
 * 
 *  # <weight>
 *  # </weight>
 */
export interface DemocracyCall_delegate {
    __kind: 'delegate'
    to: AccountId,
    conviction: Conviction,
    balance: BalanceOf,
}

/**
 *  Schedule an emergency cancellation of a referendum. Cannot happen twice to the same
 *  referendum.
 * 
 *  The dispatch origin of this call must be `CancellationOrigin`.
 * 
 *  -`ref_index`: The index of the referendum to cancel.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  # </weight>
 */
export interface DemocracyCall_emergency_cancel {
    __kind: 'emergency_cancel'
    refIndex: ReferendumIndex,
}

/**
 *  Enact a proposal from a referendum. For now we just make the weight be the maximum.
 */
export interface DemocracyCall_enact_proposal {
    __kind: 'enact_proposal'
    proposalHash: Hash,
    index: ReferendumIndex,
}

/**
 *  Schedule a referendum to be tabled once it is legal to schedule an external
 *  referendum.
 * 
 *  The dispatch origin of this call must be `ExternalOrigin`.
 * 
 *  - `proposal_hash`: The preimage hash of the proposal.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One DB change.
 *  # </weight>
 */
export interface DemocracyCall_external_propose {
    __kind: 'external_propose'
    proposalHash: Hash,
}

/**
 *  Schedule a negative-turnout-bias referendum to be tabled next once it is legal to
 *  schedule an external referendum.
 * 
 *  The dispatch of this call must be `ExternalDefaultOrigin`.
 * 
 *  - `proposal_hash`: The preimage hash of the proposal.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One DB change.
 *  # </weight>
 */
export interface DemocracyCall_external_propose_default {
    __kind: 'external_propose_default'
    proposalHash: Hash,
}

/**
 *  Schedule a majority-carries referendum to be tabled next once it is legal to schedule
 *  an external referendum.
 * 
 *  The dispatch of this call must be `ExternalMajorityOrigin`.
 * 
 *  - `proposal_hash`: The preimage hash of the proposal.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One DB change.
 *  # </weight>
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
 *  The dispatch of this call must be `FastTrackOrigin`.
 * 
 *  - `proposal_hash`: The hash of the current external proposal.
 *  - `voting_period`: The period that is allowed for voting on this proposal. Increased to
 *    `FastTrackVotingPeriod` if too low.
 *  - `delay`: The number of block after voting has ended in approval and this should be
 *    enacted. This doesn't have a minimum amount.
 * 
 *  Emits `Started`.
 * 
 *  # <weight>
 *  - One DB clear.
 *  - One DB change.
 *  - One extra DB entry.
 *  # </weight>
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
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `encoded_proposal`: The preimage of a proposal.
 * 
 *  Emits `PreimageNoted`.
 * 
 *  # <weight>
 *  - Dependent on the size of `encoded_proposal` and length of dispatch queue.
 *  # </weight>
 */
export interface DemocracyCall_note_imminent_preimage {
    __kind: 'note_imminent_preimage'
    encodedProposal: Bytes,
}

/**
 *  Register the preimage for an upcoming proposal. This doesn't require the proposal to be
 *  in the dispatch queue but does require a deposit, returned once enacted.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `encoded_proposal`: The preimage of a proposal.
 * 
 *  Emits `PreimageNoted`.
 * 
 *  # <weight>
 *  - Dependent on the size of `encoded_proposal` but protected by a
 *    required deposit.
 *  # </weight>
 */
export interface DemocracyCall_note_preimage {
    __kind: 'note_preimage'
    encodedProposal: Bytes,
}

/**
 *  Become a proxy.
 * 
 *  This must be called prior to a later `activate_proxy`.
 * 
 *  Origin must be a Signed.
 * 
 *  - `target`: The account whose votes will later be proxied.
 * 
 *  `close_proxy` must be called before the account can be destroyed.
 * 
 *  # <weight>
 *  - One extra DB entry.
 *  # </weight>
 */
export interface DemocracyCall_open_proxy {
    __kind: 'open_proxy'
    target: AccountId,
}

/**
 *  Propose a sensitive action to be taken.
 * 
 *  The dispatch origin of this call must be _Signed_ and the sender must
 *  have funds to cover the deposit.
 * 
 *  - `proposal_hash`: The hash of the proposal preimage.
 *  - `value`: The amount of deposit (must be at least `MinimumDeposit`).
 * 
 *  Emits `Proposed`.
 * 
 *  # <weight>
 *  - `O(P)`
 *  - P is the number proposals in the `PublicProps` vec.
 *  - Two DB changes, one DB entry.
 *  # </weight>
 */
export interface DemocracyCall_propose {
    __kind: 'propose'
    proposalHash: Hash,
    value: bigint,
}

/**
 *  Delegate the voting power (with some given conviction) of a proxied account.
 * 
 *  The balance delegated is locked for as long as it's delegated, and thereafter for the
 *  time appropriate for the conviction's lock period.
 * 
 *  The dispatch origin of this call must be _Signed_, and the signing account must have
 *  been set as the proxy account for `target`.
 * 
 *  - `target`: The account whole voting power shall be delegated and whose balance locked.
 *    This account must either:
 *    - be delegating already; or
 *    - have no voting activity (if there is, then it will need to be removed/consolidated
 *      through `reap_vote` or `unvote`).
 *  - `to`: The account whose voting the `target` account's voting power will follow.
 *  - `conviction`: The conviction that will be attached to the delegated votes. When the
 *    account is undelegated, the funds will be locked for the corresponding period.
 *  - `balance`: The amount of the account's balance to be used in delegating. This must
 *    not be more than the account's current balance.
 * 
 *  Emits `Delegated`.
 * 
 *  # <weight>
 *  # </weight>
 */
export interface DemocracyCall_proxy_delegate {
    __kind: 'proxy_delegate'
    to: AccountId,
    conviction: Conviction,
    balance: BalanceOf,
}

/**
 *  Remove a proxied vote for a referendum.
 * 
 *  Exactly equivalent to `remove_vote` except that it operates on the account that the
 *  sender is a proxy for.
 * 
 *  The dispatch origin of this call must be _Signed_ and the signing account must be a
 *  proxy for some other account which has a registered vote for the referendum of `index`.
 * 
 *  - `index`: The index of referendum of the vote to be removed.
 * 
 *  # <weight>
 *  - `O(R + log R)` where R is the number of referenda that `target` has voted on.
 *  # </weight>
 */
export interface DemocracyCall_proxy_remove_vote {
    __kind: 'proxy_remove_vote'
    index: ReferendumIndex,
}

/**
 *  Undelegate the voting power of a proxied account.
 * 
 *  Tokens may be unlocked following once an amount of time consistent with the lock period
 *  of the conviction with which the delegation was issued.
 * 
 *  The dispatch origin of this call must be _Signed_ and the signing account must be a
 *  proxy for some other account which is currently delegating.
 * 
 *  Emits `Undelegated`.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface DemocracyCall_proxy_undelegate {
    __kind: 'proxy_undelegate'
}

/**
 *  Vote in a referendum on behalf of a stash. If `vote.is_aye()`, the vote is to enact
 *  the proposal; otherwise it is a vote to keep the status quo.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `ref_index`: The index of the referendum to proxy vote for.
 *  - `vote`: The vote configuration.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One DB change, one DB entry.
 *  # </weight>
 */
export interface DemocracyCall_proxy_vote {
    __kind: 'proxy_vote'
    refIndex: number,
    vote: AccountVote,
}

/**
 *  Remove an expired proposal preimage and collect the deposit.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `proposal_hash`: The preimage hash of a proposal.
 * 
 *  This will only work after `VotingPeriod` blocks from the time that the preimage was
 *  noted, if it's the same account doing it. If it's a different account, then it'll only
 *  work an additional `EnactmentPeriod` later.
 * 
 *  Emits `PreimageReaped`.
 * 
 *  # <weight>
 *  - One DB clear.
 *  # </weight>
 */
export interface DemocracyCall_reap_preimage {
    __kind: 'reap_preimage'
    proposalHash: Hash,
}

/**
 *  Remove a vote for a referendum.
 * 
 *  If the `target` is equal to the signer, then this function is exactly equivalent to
 *  `remove_vote`. If not equal to the signer, then the vote must have expired,
 *  either because the referendum was cancelled, because the voter lost the referendum or
 *  because the conviction period is over.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `target`: The account of the vote to be removed; this account must have voted for
 *    referendum `index`.
 *  - `index`: The index of referendum of the vote to be removed.
 * 
 *  # <weight>
 *  - `O(R + log R)` where R is the number of referenda that `target` has voted on.
 *  # </weight>
 */
export interface DemocracyCall_remove_other_vote {
    __kind: 'remove_other_vote'
    target: AccountId,
    index: ReferendumIndex,
}

/**
 *  Remove a vote for a referendum.
 * 
 *  If:
 *  - the referendum was cancelled, or
 *  - the referendum is ongoing, or
 *  - the referendum has ended such that
 *    - the vote of the account was in opposition to the result; or
 *    - there was no conviction to the account's vote; or
 *    - the account made a split vote
 *  ...then the vote is removed cleanly and a following call to `unlock` may result in more
 *  funds being available.
 * 
 *  If, however, the referendum has ended and:
 *  - it finished corresponding to the vote of the account, and
 *  - the account made a standard vote with conviction, and
 *  - the lock period of the conviction is not over
 *  ...then the lock will be aggregated into the overall account's lock, which may involve
 *  *overlocking* (where the two locks are combined into a single lock that is the maximum
 *  of both the amount locked and the time is it locked for).
 * 
 *  The dispatch origin of this call must be _Signed_, and the signer must have a vote
 *  registered for referendum `index`.
 * 
 *  - `index`: The index of referendum of the vote to be removed.
 * 
 *  # <weight>
 *  - `O(R + log R)` where R is the number of referenda that `target` has voted on.
 *  # </weight>
 */
export interface DemocracyCall_remove_vote {
    __kind: 'remove_vote'
    index: ReferendumIndex,
}

/**
 *  Signals agreement with a particular proposal.
 * 
 *  The dispatch origin of this call must be _Signed_ and the sender
 *  must have funds to cover the deposit, equal to the original deposit.
 * 
 *  - `proposal`: The index of the proposal to second.
 * 
 *  # <weight>
 *  - `O(S)`.
 *  - S is the number of seconds a proposal already has.
 *  - One DB entry.
 *  # </weight>
 */
export interface DemocracyCall_second {
    __kind: 'second'
    proposal: number,
}

/**
 *  Undelegate the voting power of the sending account.
 * 
 *  Tokens may be unlocked following once an amount of time consistent with the lock period
 *  of the conviction with which the delegation was issued.
 * 
 *  The dispatch origin of this call must be _Signed_ and the signing account must be
 *  currently delegating.
 * 
 *  Emits `Undelegated`.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface DemocracyCall_undelegate {
    __kind: 'undelegate'
}

/**
 *  Unlock tokens that have an expired lock.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `target`: The account to remove the lock on.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  # </weight>
 */
export interface DemocracyCall_unlock {
    __kind: 'unlock'
    target: AccountId,
}

/**
 *  Veto and blacklist the external proposal hash.
 * 
 *  The dispatch origin of this call must be `VetoOrigin`.
 * 
 *  - `proposal_hash`: The preimage hash of the proposal to veto and blacklist.
 * 
 *  Emits `Vetoed`.
 * 
 *  # <weight>
 *  - Two DB entries.
 *  - One DB clear.
 *  - Performs a binary search on `existing_vetoers` which should not
 *    be very large.
 *  - O(log v), v is number of `existing_vetoers`
 *  # </weight>
 */
export interface DemocracyCall_veto_external {
    __kind: 'veto_external'
    proposalHash: Hash,
}

/**
 *  Vote in a referendum. If `vote.is_aye()`, the vote is to enact the proposal;
 *  otherwise it is a vote to keep the status quo.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `ref_index`: The index of the referendum to vote for.
 *  - `vote`: The vote configuration.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - R is the number of referendums the voter has voted on.
 *  - One DB change, one DB entry.
 *  # </weight>
 */
export interface DemocracyCall_vote {
    __kind: 'vote'
    refIndex: number,
    vote: AccountVote,
}

export const DemocracyCall: sts.Type<DemocracyCall> = sts.closedEnum(() => {
    return  {
        activate_proxy: sts.enumStruct({
            proxy: AccountId,
        }),
        cancel_queued: sts.enumStruct({
            which: ReferendumIndex,
        }),
        cancel_referendum: sts.enumStruct({
            refIndex: sts.number(),
        }),
        clear_public_proposals: sts.unit(),
        close_proxy: sts.unit(),
        deactivate_proxy: sts.enumStruct({
            proxy: AccountId,
        }),
        delegate: sts.enumStruct({
            to: AccountId,
            conviction: Conviction,
            balance: BalanceOf,
        }),
        emergency_cancel: sts.enumStruct({
            refIndex: ReferendumIndex,
        }),
        enact_proposal: sts.enumStruct({
            proposalHash: Hash,
            index: ReferendumIndex,
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
        }),
        note_preimage: sts.enumStruct({
            encodedProposal: sts.bytes(),
        }),
        open_proxy: sts.enumStruct({
            target: AccountId,
        }),
        propose: sts.enumStruct({
            proposalHash: Hash,
            value: sts.bigint(),
        }),
        proxy_delegate: sts.enumStruct({
            to: AccountId,
            conviction: Conviction,
            balance: BalanceOf,
        }),
        proxy_remove_vote: sts.enumStruct({
            index: ReferendumIndex,
        }),
        proxy_undelegate: sts.unit(),
        proxy_vote: sts.enumStruct({
            refIndex: sts.number(),
            vote: AccountVote,
        }),
        reap_preimage: sts.enumStruct({
            proposalHash: Hash,
        }),
        remove_other_vote: sts.enumStruct({
            target: AccountId,
            index: ReferendumIndex,
        }),
        remove_vote: sts.enumStruct({
            index: ReferendumIndex,
        }),
        second: sts.enumStruct({
            proposal: sts.number(),
        }),
        undelegate: sts.unit(),
        unlock: sts.enumStruct({
            target: AccountId,
        }),
        veto_external: sts.enumStruct({
            proposalHash: Hash,
        }),
        vote: sts.enumStruct({
            refIndex: sts.number(),
            vote: AccountVote,
        }),
    }
})

export type AccountVote = AccountVote_Split | AccountVote_Standard

export interface AccountVote_Split {
    __kind: 'Split'
    value: AccountVoteSplit
}

export interface AccountVote_Standard {
    __kind: 'Standard'
    value: AccountVoteStandard
}

export const AccountVote: sts.Type<AccountVote> = sts.closedEnum(() => {
    return  {
        Split: AccountVoteSplit,
        Standard: AccountVoteStandard,
    }
})

export type AccountVoteStandard = {
    vote: Vote,
    balance: Balance,
}

export const AccountVoteStandard: sts.Type<AccountVoteStandard> = sts.struct(() => {
    return  {
        vote: Vote,
        balance: Balance,
    }
})

export type Vote = number

export const Vote: sts.Type<Vote> = sts.number()

export type AccountVoteSplit = {
    aye: Balance,
    nay: Balance,
}

export const AccountVoteSplit: sts.Type<AccountVoteSplit> = sts.struct(() => {
    return  {
        aye: Balance,
        nay: Balance,
    }
})

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

export type CouncilCall = CouncilCall_close | CouncilCall_execute | CouncilCall_propose | CouncilCall_set_members | CouncilCall_vote

/**
 *  May be called by any signed account after the voting duration has ended in order to
 *  finish voting and close the proposal.
 * 
 *  Abstentions are counted as rejections unless there is a prime member set and the prime
 *  member cast an approval.
 * 
 *  - the weight of `proposal` preimage.
 *  - up to three events deposited.
 *  - one read, two removals, one mutation. (plus three static reads.)
 *  - computation and i/o `O(P + L + M)` where:
 *    - `M` is number of members,
 *    - `P` is number of active proposals,
 *    - `L` is the encoded length of `proposal` preimage.
 */
export interface CouncilCall_close {
    __kind: 'close'
    proposal: Hash,
    index: number,
}

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
 *  Set the collective's membership.
 * 
 *  - `new_members`: The new member list. Be nice to the chain and
 *  - `prime`: The prime member whose vote sets the default.
 * 
 *  Requires root origin.
 */
export interface CouncilCall_set_members {
    __kind: 'set_members'
    newMembers: AccountId[],
    prime?: (AccountId | undefined),
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
        close: sts.enumStruct({
            proposal: Hash,
            index: sts.number(),
        }),
        execute: sts.enumStruct({
            proposal: Proposal,
        }),
        propose: sts.enumStruct({
            threshold: sts.number(),
            proposal: Proposal,
        }),
        set_members: sts.enumStruct({
            newMembers: sts.array(() => AccountId),
            prime: sts.option(() => AccountId),
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
 *  Make a claim to collect your DOTs.
 * 
 *  The dispatch origin for this call must be _None_.
 * 
 *  Unsigned Validation:
 *  A call to claim is deemed valid if the signature provided matches
 *  the expected signed message of:
 * 
 *  > Ethereum Signed Message:
 *  > (configured prefix string)(address)
 * 
 *  and `address` matches the `dest` account.
 * 
 *  Parameters:
 *  - `dest`: The destination account to payout the claim.
 *  - `ethereum_signature`: The signature of an ethereum signed message
 *     matching the format described above.
 * 
 *  <weight>
 *  The weight of this call is invariant over the input parameters.
 *  - One `eth_recover` operation which involves a keccak hash and a
 *    ecdsa recover.
 *  - Three storage reads to check if a claim exists for the user, to
 *    get the current pot size, to see if there exists a vesting schedule.
 *  - Up to one storage write for adding a new vesting schedule.
 *  - One `deposit_creating` Currency call.
 *  - One storage write to update the total.
 *  - Two storage removals for vesting and claims information.
 *  - One deposit event.
 * 
 *  Total Complexity: O(1)
 *  </weight>
 */
export interface ClaimsCall_claim {
    __kind: 'claim'
    dest: AccountId,
    ethereumSignature: EcdsaSignature,
}

/**
 *  Mint a new claim to collect DOTs.
 * 
 *  The dispatch origin for this call must be _Root_.
 * 
 *  Parameters:
 *  - `who`: The Ethereum address allowed to collect this claim.
 *  - `value`: The number of DOTs that will be claimed.
 *  - `vesting_schedule`: An optional vesting schedule for these DOTs.
 * 
 *  <weight>
 *  The weight of this call is invariant over the input parameters.
 *  - One storage mutate to increase the total claims available.
 *  - One storage write to add a new claim.
 *  - Up to one storage write to add a new vesting schedule.
 * 
 *  Total Complexity: O(1)
 *  </weight>
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

export type EthereumAddress = Bytes

export const EthereumAddress: sts.Type<EthereumAddress> = sts.bytes()

export type EcdsaSignature = Bytes

export const EcdsaSignature: sts.Type<EcdsaSignature> = sts.bytes()

export type BalancesCall = BalancesCall_force_transfer | BalancesCall_set_balance | BalancesCall_transfer | BalancesCall_transfer_keep_alive

/**
 *  Exactly as `transfer`, except the origin must be root and the source account may be
 *  specified.
 *  # <weight>
 *  - Same as transfer, but additional read and write because the source account is
 *    not assumed to be in the overlay.
 *  # </weight>
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
 *  it will reset the account nonce (`frame_system::AccountNonce`).
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
 *    - Removing enough funds from an account will trigger `T::DustRemoval::on_unbalanced`.
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

export type DoubleVoteReport = {
    identity: ValidatorId,
    first: [Statement, ValidatorSignature],
    second: [Statement, ValidatorSignature],
    proof: MembershipProof,
    signingContext: SigningContext,
}

export const DoubleVoteReport: sts.Type<DoubleVoteReport> = sts.struct(() => {
    return  {
        identity: ValidatorId,
        first: sts.tuple(() => Statement, ValidatorSignature),
        second: sts.tuple(() => Statement, ValidatorSignature),
        proof: MembershipProof,
        signingContext: SigningContext,
    }
})

export type SigningContext = {
    sessionIndex: SessionIndex,
    parentHash: Hash,
}

export const SigningContext: sts.Type<SigningContext> = sts.struct(() => {
    return  {
        sessionIndex: SessionIndex,
        parentHash: Hash,
    }
})

export type MembershipProof = {
    session: SessionIndex,
    trieNodes: Bytes[],
    validatorCount: ValidatorCount,
}

export const MembershipProof: sts.Type<MembershipProof> = sts.struct(() => {
    return  {
        session: SessionIndex,
        trieNodes: sts.array(() => sts.bytes()),
        validatorCount: ValidatorCount,
    }
})

export type ValidatorCount = number

export const ValidatorCount: sts.Type<ValidatorCount> = sts.number()

export type Statement = Statement_Candidate | Statement_Invalid | Statement_Never | Statement_Valid

export interface Statement_Candidate {
    __kind: 'Candidate'
    value: Hash
}

export interface Statement_Invalid {
    __kind: 'Invalid'
    value: Hash
}

export interface Statement_Never {
    __kind: 'Never'
}

export interface Statement_Valid {
    __kind: 'Valid'
    value: Hash
}

export const Statement: sts.Type<Statement> = sts.closedEnum(() => {
    return  {
        Candidate: Hash,
        Invalid: Hash,
        Never: sts.unit(),
        Valid: Hash,
    }
})

export type ValidatorId = Bytes

export const ValidatorId: sts.Type<ValidatorId> = sts.bytes()

export type Proposal = Proposal_Attestations | Proposal_AuthorityDiscovery | Proposal_Authorship | Proposal_Babe | Proposal_Balances | Proposal_Claims | Proposal_Council | Proposal_Democracy | Proposal_ElectionsPhragmen | Proposal_FinalityTracker | Proposal_Grandpa | Proposal_Identity | Proposal_ImOnline | Proposal_Indices | Proposal_Offences | Proposal_Parachains | Proposal_Recovery | Proposal_Registrar | Proposal_Scheduler | Proposal_Session | Proposal_Slots | Proposal_Society | Proposal_Staking | Proposal_System | Proposal_TechnicalCommittee | Proposal_TechnicalMembership | Proposal_Timestamp | Proposal_Treasury | Proposal_Utility | Proposal_Vesting

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

export interface Proposal_Identity {
    __kind: 'Identity'
    value: IdentityCall
}

export interface Proposal_ImOnline {
    __kind: 'ImOnline'
    value: ImOnlineCall
}

export interface Proposal_Indices {
    __kind: 'Indices'
    value: IndicesCall
}

export interface Proposal_Offences {
    __kind: 'Offences'
    value: OffencesCall
}

export interface Proposal_Parachains {
    __kind: 'Parachains'
    value: ParachainsCall
}

export interface Proposal_Recovery {
    __kind: 'Recovery'
    value: RecoveryCall
}

export interface Proposal_Registrar {
    __kind: 'Registrar'
    value: RegistrarCall
}

export interface Proposal_Scheduler {
    __kind: 'Scheduler'
    value: SchedulerCall
}

export interface Proposal_Session {
    __kind: 'Session'
    value: SessionCall
}

export interface Proposal_Slots {
    __kind: 'Slots'
    value: SlotsCall
}

export interface Proposal_Society {
    __kind: 'Society'
    value: SocietyCall
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

export interface Proposal_Utility {
    __kind: 'Utility'
    value: UtilityCall
}

export interface Proposal_Vesting {
    __kind: 'Vesting'
    value: VestingCall
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
        Identity: IdentityCall,
        ImOnline: ImOnlineCall,
        Indices: IndicesCall,
        Offences: OffencesCall,
        Parachains: ParachainsCall,
        Recovery: RecoveryCall,
        Registrar: RegistrarCall,
        Scheduler: SchedulerCall,
        Session: SessionCall,
        Slots: SlotsCall,
        Society: SocietyCall,
        Staking: StakingCall,
        System: SystemCall,
        TechnicalCommittee: TechnicalCommitteeCall,
        TechnicalMembership: TechnicalMembershipCall,
        Timestamp: TimestampCall,
        Treasury: TreasuryCall,
        Utility: UtilityCall,
        Vesting: VestingCall,
    }
})

export type ReferendumIndex = number

export const ReferendumIndex: sts.Type<ReferendumIndex> = sts.number()

export type Hash = Bytes

export const Hash: sts.Type<Hash> = sts.bytes()

export type EraIndex = number

export const EraIndex: sts.Type<EraIndex> = sts.number()

export type PhragmenScore = bigint[]

export const PhragmenScore: sts.Type<PhragmenScore> = sts.array(() => sts.bigint())

export type CompactAssignments = {
    votes1: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes2: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes3: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes4: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes5: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes6: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes7: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes8: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes9: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes10: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes11: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes12: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes13: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes14: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes15: [NominatorIndex, CompactScore[], ValidatorIndex][],
    votes16: [NominatorIndex, CompactScore[], ValidatorIndex][],
}

export const CompactAssignments: sts.Type<CompactAssignments> = sts.struct(() => {
    return  {
        votes1: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes2: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes3: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes4: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes5: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes6: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes7: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes8: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes9: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes10: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes11: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes12: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes13: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes14: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes15: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
        votes16: sts.array(() => sts.tuple(() => NominatorIndex, sts.array(() => CompactScore), ValidatorIndex)),
    }
})

export type CompactScore = [ValidatorIndex, OffchainAccuracy]

export const CompactScore: sts.Type<CompactScore> = sts.tuple(() => ValidatorIndex, OffchainAccuracy)

export type OffchainAccuracy = number

export const OffchainAccuracy: sts.Type<OffchainAccuracy> = sts.number()

export type NominatorIndex = number

export const NominatorIndex: sts.Type<NominatorIndex> = sts.number()

export type ValidatorIndex = number

export const ValidatorIndex: sts.Type<ValidatorIndex> = sts.number()

export type TaskAddress = [BlockNumber, number]

export const TaskAddress: sts.Type<TaskAddress> = sts.tuple(() => BlockNumber, sts.number())

export type BlockNumber = number

export const BlockNumber: sts.Type<BlockNumber> = sts.number()

export type DispatchResult = DispatchResult_Err | DispatchResult_Ok

export interface DispatchResult_Err {
    __kind: 'Err'
    value: DispatchError
}

export interface DispatchResult_Ok {
    __kind: 'Ok'
}

export const DispatchResult: sts.Type<DispatchResult> = sts.closedEnum(() => {
    return  {
        Err: DispatchError,
        Ok: sts.unit(),
    }
})

export type CallHash = Bytes

export const CallHash: sts.Type<CallHash> = sts.bytes()

export type Timepoint = {
    height: BlockNumber,
    index: number,
}

export const Timepoint: sts.Type<Timepoint> = sts.struct(() => {
    return  {
        height: BlockNumber,
        index: sts.number(),
    }
})

export type AccountId = Bytes

export const AccountId: sts.Type<AccountId> = sts.bytes()

export type OpaqueTimeSlot = Bytes

export const OpaqueTimeSlot: sts.Type<OpaqueTimeSlot> = sts.bytes()

export type Kind = Bytes

export const Kind: sts.Type<Kind> = sts.bytes()

export type ElectionCompute = ElectionCompute_OnChain | ElectionCompute_Signed | ElectionCompute_Unsigned

export interface ElectionCompute_OnChain {
    __kind: 'OnChain'
}

export interface ElectionCompute_Signed {
    __kind: 'Signed'
}

export interface ElectionCompute_Unsigned {
    __kind: 'Unsigned'
}

export const ElectionCompute: sts.Type<ElectionCompute> = sts.closedEnum(() => {
    return  {
        OnChain: sts.unit(),
        Signed: sts.unit(),
        Unsigned: sts.unit(),
    }
})

export type DispatchInfo = {
    weight: Weight,
    class: DispatchClass,
    paysFee: boolean,
}

export const DispatchInfo: sts.Type<DispatchInfo> = sts.struct(() => {
    return  {
        weight: Weight,
        class: DispatchClass,
        paysFee: sts.boolean(),
    }
})

export type DispatchClass = DispatchClass_Mandatory | DispatchClass_Normal | DispatchClass_Operational

export interface DispatchClass_Mandatory {
    __kind: 'Mandatory'
}

export interface DispatchClass_Normal {
    __kind: 'Normal'
}

export interface DispatchClass_Operational {
    __kind: 'Operational'
}

export const DispatchClass: sts.Type<DispatchClass> = sts.closedEnum(() => {
    return  {
        Mandatory: sts.unit(),
        Normal: sts.unit(),
        Operational: sts.unit(),
    }
})

export type Weight = bigint

export const Weight: sts.Type<Weight> = sts.bigint()

export type DispatchError = DispatchError_Arithmetic | DispatchError_BadOrigin | DispatchError_CannotLookup | DispatchError_ConsumerRemaining | DispatchError_Module | DispatchError_NoProviders | DispatchError_Other | DispatchError_Token

export interface DispatchError_Arithmetic {
    __kind: 'Arithmetic'
    value: ArithmeticError
}

export interface DispatchError_BadOrigin {
    __kind: 'BadOrigin'
}

export interface DispatchError_CannotLookup {
    __kind: 'CannotLookup'
}

export interface DispatchError_ConsumerRemaining {
    __kind: 'ConsumerRemaining'
}

export interface DispatchError_Module {
    __kind: 'Module'
    value: DispatchErrorModule
}

export interface DispatchError_NoProviders {
    __kind: 'NoProviders'
}

export interface DispatchError_Other {
    __kind: 'Other'
}

export interface DispatchError_Token {
    __kind: 'Token'
    value: TokenError
}

export const DispatchError: sts.Type<DispatchError> = sts.closedEnum(() => {
    return  {
        Arithmetic: ArithmeticError,
        BadOrigin: sts.unit(),
        CannotLookup: sts.unit(),
        ConsumerRemaining: sts.unit(),
        Module: DispatchErrorModule,
        NoProviders: sts.unit(),
        Other: sts.unit(),
        Token: TokenError,
    }
})

export type TokenError = TokenError_BelowMinimum | TokenError_CannotCreate | TokenError_Frozen | TokenError_NoFunds | TokenError_Overflow | TokenError_Underflow | TokenError_UnknownAsset | TokenError_WouldDie

export interface TokenError_BelowMinimum {
    __kind: 'BelowMinimum'
}

export interface TokenError_CannotCreate {
    __kind: 'CannotCreate'
}

export interface TokenError_Frozen {
    __kind: 'Frozen'
}

export interface TokenError_NoFunds {
    __kind: 'NoFunds'
}

export interface TokenError_Overflow {
    __kind: 'Overflow'
}

export interface TokenError_Underflow {
    __kind: 'Underflow'
}

export interface TokenError_UnknownAsset {
    __kind: 'UnknownAsset'
}

export interface TokenError_WouldDie {
    __kind: 'WouldDie'
}

export const TokenError: sts.Type<TokenError> = sts.closedEnum(() => {
    return  {
        BelowMinimum: sts.unit(),
        CannotCreate: sts.unit(),
        Frozen: sts.unit(),
        NoFunds: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
        UnknownAsset: sts.unit(),
        WouldDie: sts.unit(),
    }
})

export type DispatchErrorModule = {
    index: number,
    error: number,
}

export const DispatchErrorModule: sts.Type<DispatchErrorModule> = sts.struct(() => {
    return  {
        index: sts.number(),
        error: sts.number(),
    }
})

export type ArithmeticError = ArithmeticError_DivisionByZero | ArithmeticError_Overflow | ArithmeticError_Underflow

export interface ArithmeticError_DivisionByZero {
    __kind: 'DivisionByZero'
}

export interface ArithmeticError_Overflow {
    __kind: 'Overflow'
}

export interface ArithmeticError_Underflow {
    __kind: 'Underflow'
}

export const ArithmeticError: sts.Type<ArithmeticError> = sts.closedEnum(() => {
    return  {
        DivisionByZero: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
    }
})
