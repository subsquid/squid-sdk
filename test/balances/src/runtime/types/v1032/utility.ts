import {sts} from '../../pallet.support'
import {AccountId, Timepoint, Type_110, DispatchResult, DispatchError} from './types'

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
export type UtilityCancelAsMultiCall = {
    threshold: number,
    other_signatories: AccountId[],
    timepoint: Timepoint,
    call_hash: Bytes,
}

export const UtilityCancelAsMultiCall: sts.Type<UtilityCancelAsMultiCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        other_signatories: sts.array(() => AccountId),
        timepoint: Timepoint,
        call_hash: sts.bytes(),
    }
})

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
export type UtilityBatchCall = {
    calls: Type_110[],
}

export const UtilityBatchCall: sts.Type<UtilityBatchCall> = sts.struct(() => {
    return  {
        calls: sts.array(() => Type_110),
    }
})

/**
 *  Send a call through an indexed pseudonym of the sender.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - The weight of the `call`.
 *  # </weight>
 */
export type UtilityAsSubCall = {
    index: number,
    call: Type_110,
}

export const UtilityAsSubCall: sts.Type<UtilityAsSubCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        call: Type_110,
    }
})

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
export type UtilityAsMultiCall = {
    threshold: number,
    other_signatories: AccountId[],
    maybe_timepoint?: (Timepoint | undefined),
    call: Type_110,
}

export const UtilityAsMultiCall: sts.Type<UtilityAsMultiCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        other_signatories: sts.array(() => AccountId),
        maybe_timepoint: sts.option(() => Timepoint),
        call: Type_110,
    }
})

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
export type UtilityApproveAsMultiCall = {
    threshold: number,
    other_signatories: AccountId[],
    maybe_timepoint?: (Timepoint | undefined),
    call_hash: Bytes,
}

export const UtilityApproveAsMultiCall: sts.Type<UtilityApproveAsMultiCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        other_signatories: sts.array(() => AccountId),
        maybe_timepoint: sts.option(() => Timepoint),
        call_hash: sts.bytes(),
    }
})

/**
 *  A new multisig operation has begun. First param is the account that is approving,
 *  second is the multisig account.
 */
export type UtilityNewMultisigEvent = [AccountId, AccountId]

export const UtilityNewMultisigEvent: sts.Type<UtilityNewMultisigEvent> = sts.tuple(() => AccountId, AccountId)

/**
 *  A multisig operation has been executed. First param is the account that is
 *  approving, third is the multisig account.
 */
export type UtilityMultisigExecutedEvent = [AccountId, Timepoint, AccountId, DispatchResult]

export const UtilityMultisigExecutedEvent: sts.Type<UtilityMultisigExecutedEvent> = sts.tuple(() => AccountId, Timepoint, AccountId, DispatchResult)

/**
 *  A multisig operation has been cancelled. First param is the account that is
 *  cancelling, third is the multisig account.
 */
export type UtilityMultisigCancelledEvent = [AccountId, Timepoint, AccountId]

export const UtilityMultisigCancelledEvent: sts.Type<UtilityMultisigCancelledEvent> = sts.tuple(() => AccountId, Timepoint, AccountId)

/**
 *  A multisig operation has been approved by someone. First param is the account that is
 *  approving, third is the multisig account.
 */
export type UtilityMultisigApprovalEvent = [AccountId, Timepoint, AccountId]

export const UtilityMultisigApprovalEvent: sts.Type<UtilityMultisigApprovalEvent> = sts.tuple(() => AccountId, Timepoint, AccountId)

/**
 *  Batch of dispatches did not complete fully. Index of first failing dispatch given, as
 *  well as the error.
 */
export type UtilityBatchInterruptedEvent = [number, DispatchError]

export const UtilityBatchInterruptedEvent: sts.Type<UtilityBatchInterruptedEvent> = sts.tuple(() => sts.number(), DispatchError)

/**
 *  Batch of dispatches completed fully with no error.
 */
export type UtilityBatchCompletedEvent = null

export const UtilityBatchCompletedEvent: sts.Type<UtilityBatchCompletedEvent> = sts.unit()
