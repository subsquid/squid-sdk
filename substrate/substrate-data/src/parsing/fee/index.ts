import {Bytes, Runtime} from '@subsquid/substrate-runtime'
import {assertNotNull} from '@subsquid/util-internal'
import {Event, Extrinsic} from '../../interfaces/data'
import {assertEvent, isEvent, UnexpectedEventType} from '../../types/util'
import {getFeeCalc} from './calc'
import {
    AcalaTransactionFeePaid,
    ExtrinsicFailed,
    ExtrinsicSuccessLatest,
    ExtrinsicSuccessLegacy,
    IDispatchInfo,
    TransactionFeePaid
} from './types'


export function setExtrinsicFeesFromPaidEvent(
    runtime: Runtime,
    extrinsics: Extrinsic[],
    events: Event[]
): void {
    for (let e of events) {
        if (e.name == 'TransactionPayment.TransactionFeePaid') {
            let extrinsic = extrinsics[assertNotNull(e.extrinsicIndex)]
            let actualFee: bigint
            let tip: bigint
            if (isEvent(runtime, TransactionFeePaid, e)) {
                actualFee = BigInt(e.args.actualFee)
                tip = BigInt(e.args.tip)
            } else if (isEvent(runtime, AcalaTransactionFeePaid, e)) {
                actualFee = BigInt(e.args.actualFee)
                tip = BigInt(e.args.actualTip)
            } else {
                throw new Error('TransactionPayment.TransactionFeePaid event has unexpected type')
            }
            extrinsic.fee = actualFee - tip
            extrinsic.tip = tip
        }
    }
}


export function setExtrinsicFeesFromCalc(
    runtime: Runtime,
    rawExtrinsics: Bytes[],
    extrinsics: Extrinsic[],
    events: Event[],
    prevBlockSpecName: string,
    prevBlockSpecVersion: number,
    feeMultiplier: number | bigint
): void {
    let calc = getFeeCalc(
        runtime,
        feeMultiplier,
        prevBlockSpecName,
        prevBlockSpecVersion
    )

    if (calc == null) return

    for (let e of events) {
        let extrinsicIndex: number
        let dispatchInfo: IDispatchInfo
        switch(e.name) {
            case 'System.ExtrinsicSuccess':
                extrinsicIndex = assertNotNull(e.extrinsicIndex)
                if (isEvent(runtime, ExtrinsicSuccessLatest, e)) {
                    dispatchInfo = e.args.dispatchInfo
                } else if (isEvent(runtime, ExtrinsicSuccessLegacy, e)) {
                    dispatchInfo = e.args
                } else {
                    throw new UnexpectedEventType('System.ExtrinsicSuccess')
                }
                break
            case 'System.ExtrinsicFailed':
                extrinsicIndex = assertNotNull(e.extrinsicIndex)
                assertEvent(runtime, ExtrinsicFailed, e)
                if (Array.isArray(e.args)) {
                    dispatchInfo = e.args[1]
                } else {
                    dispatchInfo = e.args.dispatchInfo
                }
                break
            default:
                continue
        }

        let extrinsic = extrinsics[extrinsicIndex]
        if (extrinsic.signature == null) continue

        let len = rawExtrinsics[extrinsicIndex].length / 2 - 1
        extrinsic.fee = calc(dispatchInfo, len)
    }
}
