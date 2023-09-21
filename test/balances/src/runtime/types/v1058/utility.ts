import {sts} from '../../pallet.support'
import {Type_176, AccountId, Timepoint, CallHash, DispatchResult} from './types'

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
    calls: Type_176[],
}

export const UtilityBatchCall: sts.Type<UtilityBatchCall> = sts.struct(() => {
    return  {
        calls: sts.array(() => Type_176),
    }
})

/**
 *  Send a call through an indexed pseudonym of the sender.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - The weight of the `call` + 10,000.
 *  # </weight>
 */
export type UtilityAsSubCall = {
    index: number,
    call: Type_176,
}

export const UtilityAsSubCall: sts.Type<UtilityAsSubCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        call: Type_176,
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
    call: Type_176,
}

export const UtilityAsMultiCall: sts.Type<UtilityAsMultiCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        other_signatories: sts.array(() => AccountId),
        maybe_timepoint: sts.option(() => Timepoint),
        call: Type_176,
    }
})

/**
 *  A new multisig operation has begun. First param is the account that is approving,
 *  second is the multisig account, third is hash of the call.
 */
export type UtilityNewMultisigEvent = [AccountId, AccountId, CallHash]

export const UtilityNewMultisigEvent: sts.Type<UtilityNewMultisigEvent> = sts.tuple(() => AccountId, AccountId, CallHash)

/**
 *  A multisig operation has been executed. First param is the account that is
 *  approving, third is the multisig account, fourth is hash of the call to be executed.
 */
export type UtilityMultisigExecutedEvent = [AccountId, Timepoint, AccountId, CallHash, DispatchResult]

export const UtilityMultisigExecutedEvent: sts.Type<UtilityMultisigExecutedEvent> = sts.tuple(() => AccountId, Timepoint, AccountId, CallHash, DispatchResult)

/**
 *  A multisig operation has been cancelled. First param is the account that is
 *  cancelling, third is the multisig account, fourth is hash of the call.
 */
export type UtilityMultisigCancelledEvent = [AccountId, Timepoint, AccountId, CallHash]

export const UtilityMultisigCancelledEvent: sts.Type<UtilityMultisigCancelledEvent> = sts.tuple(() => AccountId, Timepoint, AccountId, CallHash)

/**
 *  A multisig operation has been approved by someone. First param is the account that is
 *  approving, third is the multisig account, fourth is hash of the call.
 */
export type UtilityMultisigApprovalEvent = [AccountId, Timepoint, AccountId, CallHash]

export const UtilityMultisigApprovalEvent: sts.Type<UtilityMultisigApprovalEvent> = sts.tuple(() => AccountId, Timepoint, AccountId, CallHash)
