import {sts} from '../../pallet.support'
import {AccountId, Timepoint, Type_188, CallHash, DispatchResult} from './types'

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
 *  ----------------------------------
 *  - Base Weight: 37.6 + 0.084 * S
 *  - DB Weight:
 *      - Read: Multisig Storage, [Caller Account]
 *      - Write: Multisig Storage, [Caller Account]
 *  # </weight>
 */
export type MultisigCancelAsMultiCall = {
    threshold: number,
    other_signatories: AccountId[],
    timepoint: Timepoint,
    call_hash: Bytes,
}

export const MultisigCancelAsMultiCall: sts.Type<MultisigCancelAsMultiCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        other_signatories: sts.array(() => AccountId),
        timepoint: Timepoint,
        call_hash: sts.bytes(),
    }
})

/**
 *  Register approval for a dispatch to be made from a deterministic composite account if
 *  approved by a total of `threshold - 1` of `other_signatories`.
 * 
 *  If there are enough, then dispatch the call. Calls must each fulfil the `IsCallable`
 *  filter.
 * 
 *  Payment: `DepositBase` will be reserved if this is the first approval, plus
 *  `threshold` times `DepositFactor`. It is returned once this dispatch happens or
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
 *    `DepositBase + threshold * DepositFactor`.
 *  -------------------------------
 *  - Base Weight:
 *      - Create: 46.55 + 0.089 * S µs
 *      - Approve: 34.03 + .112 * S µs
 *      - Complete: 40.36 + .225 * S µs
 *  - DB Weight:
 *      - Reads: Multisig Storage, [Caller Account]
 *      - Writes: Multisig Storage, [Caller Account]
 *  - Plus Call Weight
 *  # </weight>
 */
export type MultisigAsMultiCall = {
    threshold: number,
    other_signatories: AccountId[],
    maybe_timepoint?: (Timepoint | undefined),
    call: Type_188,
}

export const MultisigAsMultiCall: sts.Type<MultisigAsMultiCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        other_signatories: sts.array(() => AccountId),
        maybe_timepoint: sts.option(() => Timepoint),
        call: Type_188,
    }
})

/**
 *  Register approval for a dispatch to be made from a deterministic composite account if
 *  approved by a total of `threshold - 1` of `other_signatories`.
 * 
 *  Payment: `DepositBase` will be reserved if this is the first approval, plus
 *  `threshold` times `DepositFactor`. It is returned once this dispatch happens or
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
 *    `DepositBase + threshold * DepositFactor`.
 *  ----------------------------------
 *  - Base Weight:
 *      - Create: 44.71 + 0.088 * S
 *      - Approve: 31.48 + 0.116 * S
 *  - DB Weight:
 *      - Read: Multisig Storage, [Caller Account]
 *      - Write: Multisig Storage, [Caller Account]
 *  # </weight>
 */
export type MultisigApproveAsMultiCall = {
    threshold: number,
    other_signatories: AccountId[],
    maybe_timepoint?: (Timepoint | undefined),
    call_hash: Bytes,
}

export const MultisigApproveAsMultiCall: sts.Type<MultisigApproveAsMultiCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        other_signatories: sts.array(() => AccountId),
        maybe_timepoint: sts.option(() => Timepoint),
        call_hash: sts.bytes(),
    }
})

/**
 *  A call with a `false` IsCallable filter was attempted.
 */
export type MultisigUncallableEvent = [number]

export const MultisigUncallableEvent: sts.Type<MultisigUncallableEvent> = sts.tuple(() => sts.number())

/**
 *  A new multisig operation has begun. First param is the account that is approving,
 *  second is the multisig account, third is hash of the call.
 */
export type MultisigNewMultisigEvent = [AccountId, AccountId, CallHash]

export const MultisigNewMultisigEvent: sts.Type<MultisigNewMultisigEvent> = sts.tuple(() => AccountId, AccountId, CallHash)

/**
 *  A multisig operation has been executed. First param is the account that is
 *  approving, third is the multisig account, fourth is hash of the call to be executed.
 */
export type MultisigMultisigExecutedEvent = [AccountId, Timepoint, AccountId, CallHash, DispatchResult]

export const MultisigMultisigExecutedEvent: sts.Type<MultisigMultisigExecutedEvent> = sts.tuple(() => AccountId, Timepoint, AccountId, CallHash, DispatchResult)

/**
 *  A multisig operation has been cancelled. First param is the account that is
 *  cancelling, third is the multisig account, fourth is hash of the call.
 */
export type MultisigMultisigCancelledEvent = [AccountId, Timepoint, AccountId, CallHash]

export const MultisigMultisigCancelledEvent: sts.Type<MultisigMultisigCancelledEvent> = sts.tuple(() => AccountId, Timepoint, AccountId, CallHash)

/**
 *  A multisig operation has been approved by someone. First param is the account that is
 *  approving, third is the multisig account, fourth is hash of the call.
 */
export type MultisigMultisigApprovalEvent = [AccountId, Timepoint, AccountId, CallHash]

export const MultisigMultisigApprovalEvent: sts.Type<MultisigMultisigApprovalEvent> = sts.tuple(() => AccountId, Timepoint, AccountId, CallHash)
