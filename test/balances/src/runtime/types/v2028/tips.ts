import {sts} from '../../pallet.support'
import {AccountId, Hash, Balance} from './types'

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
 *  - Complexity: `O(R + T)` where `R` length of `reason`, `T` is the number of tippers.
 *    - `O(T)`: decoding `Tipper` vec of length `T`
 *      `T` is charged as upper bound given by `ContainsLengthBound`.
 *      The actual cost depends on the implementation of `T::Tippers`.
 *    - `O(R)`: hashing and encoding of reason of length `R`
 *  - DbReads: `Tippers`, `Reasons`
 *  - DbWrites: `Reasons`, `Tips`
 *  # </weight>
 */
export type TipsTipNewCall = {
    reason: Bytes,
    who: AccountId,
    tip_value: bigint,
}

export const TipsTipNewCall: sts.Type<TipsTipNewCall> = sts.struct(() => {
    return  {
        reason: sts.bytes(),
        who: AccountId,
        tip_value: sts.bigint(),
    }
})

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
 *  - Complexity: `O(T)` where `T` is the number of tippers.
 *    decoding `Tipper` vec of length `T`, insert tip and check closing,
 *    `T` is charged as upper bound given by `ContainsLengthBound`.
 *    The actual cost depends on the implementation of `T::Tippers`.
 * 
 *    Actually weight could be lower as it depends on how many tips are in `OpenTip` but it
 *    is weighted as if almost full i.e of length `T-1`.
 *  - DbReads: `Tippers`, `Tips`
 *  - DbWrites: `Tips`
 *  # </weight>
 */
export type TipsTipCall = {
    hash: Hash,
    tip_value: bigint,
}

export const TipsTipCall: sts.Type<TipsTipCall> = sts.struct(() => {
    return  {
        hash: Hash,
        tip_value: sts.bigint(),
    }
})

/**
 *  Remove and slash an already-open tip.
 * 
 *  May only be called from `T::RejectOrigin`.
 * 
 *  As a result, the finder is slashed and the deposits are lost.
 * 
 *  Emits `TipSlashed` if successful.
 * 
 *  # <weight>
 *    `T` is charged as upper bound given by `ContainsLengthBound`.
 *    The actual cost depends on the implementation of `T::Tippers`.
 *  # </weight>
 */
export type TipsSlashTipCall = {
    hash: Hash,
}

export const TipsSlashTipCall: sts.Type<TipsSlashTipCall> = sts.struct(() => {
    return  {
        hash: Hash,
    }
})

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
 *  - Complexity: `O(1)`
 *    - Depends on the length of `T::Hash` which is fixed.
 *  - DbReads: `Tips`, `origin account`
 *  - DbWrites: `Reasons`, `Tips`, `origin account`
 *  # </weight>
 */
export type TipsRetractTipCall = {
    hash: Hash,
}

export const TipsRetractTipCall: sts.Type<TipsRetractTipCall> = sts.struct(() => {
    return  {
        hash: Hash,
    }
})

/**
 *  Report something `reason` that deserves a tip and claim any eventual the finder's fee.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Payment: `TipReportDepositBase` will be reserved from the origin account, as well as
 *  `DataDepositPerByte` for each byte in `reason`.
 * 
 *  - `reason`: The reason for, or the thing that deserves, the tip; generally this will be
 *    a UTF-8-encoded URL.
 *  - `who`: The account which should be credited for the tip.
 * 
 *  Emits `NewTip` if successful.
 * 
 *  # <weight>
 *  - Complexity: `O(R)` where `R` length of `reason`.
 *    - encoding and hashing of 'reason'
 *  - DbReads: `Reasons`, `Tips`
 *  - DbWrites: `Reasons`, `Tips`
 *  # </weight>
 */
export type TipsReportAwesomeCall = {
    reason: Bytes,
    who: AccountId,
}

export const TipsReportAwesomeCall: sts.Type<TipsReportAwesomeCall> = sts.struct(() => {
    return  {
        reason: sts.bytes(),
        who: AccountId,
    }
})

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
 *  - Complexity: `O(T)` where `T` is the number of tippers.
 *    decoding `Tipper` vec of length `T`.
 *    `T` is charged as upper bound given by `ContainsLengthBound`.
 *    The actual cost depends on the implementation of `T::Tippers`.
 *  - DbReads: `Tips`, `Tippers`, `tip finder`
 *  - DbWrites: `Reasons`, `Tips`, `Tippers`, `tip finder`
 *  # </weight>
 */
export type TipsCloseTipCall = {
    hash: Hash,
}

export const TipsCloseTipCall: sts.Type<TipsCloseTipCall> = sts.struct(() => {
    return  {
        hash: Hash,
    }
})

/**
 *  A tip suggestion has been slashed. \[tip_hash, finder, deposit\]
 */
export type TipsTipSlashedEvent = [Hash, AccountId, Balance]

export const TipsTipSlashedEvent: sts.Type<TipsTipSlashedEvent> = sts.tuple(() => Hash, AccountId, Balance)

/**
 *  A tip suggestion has been retracted. \[tip_hash\]
 */
export type TipsTipRetractedEvent = [Hash]

export const TipsTipRetractedEvent: sts.Type<TipsTipRetractedEvent> = sts.tuple(() => Hash)

/**
 *  A tip suggestion has reached threshold and is closing. \[tip_hash\]
 */
export type TipsTipClosingEvent = [Hash]

export const TipsTipClosingEvent: sts.Type<TipsTipClosingEvent> = sts.tuple(() => Hash)

/**
 *  A tip suggestion has been closed. \[tip_hash, who, payout\]
 */
export type TipsTipClosedEvent = [Hash, AccountId, Balance]

export const TipsTipClosedEvent: sts.Type<TipsTipClosedEvent> = sts.tuple(() => Hash, AccountId, Balance)

/**
 *  A new tip suggestion has been opened. \[tip_hash\]
 */
export type TipsNewTipEvent = [Hash]

export const TipsNewTipEvent: sts.Type<TipsNewTipEvent> = sts.tuple(() => Hash)
