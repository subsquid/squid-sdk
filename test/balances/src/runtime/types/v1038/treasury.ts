import {sts} from '../../pallet.support'
import {AccountId, BalanceOf, Hash, Balance} from './types'

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
export type TreasuryTipNewCall = {
    reason: Bytes,
    who: AccountId,
    tip_value: BalanceOf,
}

export const TreasuryTipNewCall: sts.Type<TreasuryTipNewCall> = sts.struct(() => {
    return  {
        reason: sts.bytes(),
        who: AccountId,
        tip_value: BalanceOf,
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
 *  - `O(T)`
 *  - One storage mutation (codec `O(T)`), one storage read `O(1)`.
 *  - Up to one event.
 *  # </weight>
 */
export type TreasuryTipCall = {
    hash: Hash,
    tip_value: BalanceOf,
}

export const TreasuryTipCall: sts.Type<TreasuryTipCall> = sts.struct(() => {
    return  {
        hash: Hash,
        tip_value: BalanceOf,
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
 *  - `O(T)`
 *  - One balance operation.
 *  - Two storage removals (one read, codec `O(T)`).
 *  - One event.
 *  # </weight>
 */
export type TreasuryRetractTipCall = {
    hash: Hash,
}

export const TreasuryRetractTipCall: sts.Type<TreasuryRetractTipCall> = sts.struct(() => {
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
export type TreasuryReportAwesomeCall = {
    reason: Bytes,
    who: AccountId,
}

export const TreasuryReportAwesomeCall: sts.Type<TreasuryReportAwesomeCall> = sts.struct(() => {
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
 *  - `O(T)`
 *  - One storage retrieval (codec `O(T)`) and two removals.
 *  - Up to three balance operations.
 *  # </weight>
 */
export type TreasuryCloseTipCall = {
    hash: Hash,
}

export const TreasuryCloseTipCall: sts.Type<TreasuryCloseTipCall> = sts.struct(() => {
    return  {
        hash: Hash,
    }
})

/**
 *  A tip suggestion has been retracted.
 */
export type TreasuryTipRetractedEvent = [Hash]

export const TreasuryTipRetractedEvent: sts.Type<TreasuryTipRetractedEvent> = sts.tuple(() => Hash)

/**
 *  A tip suggestion has reached threshold and is closing.
 */
export type TreasuryTipClosingEvent = [Hash]

export const TreasuryTipClosingEvent: sts.Type<TreasuryTipClosingEvent> = sts.tuple(() => Hash)

/**
 *  A tip suggestion has been closed.
 */
export type TreasuryTipClosedEvent = [Hash, AccountId, Balance]

export const TreasuryTipClosedEvent: sts.Type<TreasuryTipClosedEvent> = sts.tuple(() => Hash, AccountId, Balance)

/**
 *  A new tip suggestion has been opened.
 */
export type TreasuryNewTipEvent = [Hash]

export const TreasuryNewTipEvent: sts.Type<TreasuryNewTipEvent> = sts.tuple(() => Hash)
