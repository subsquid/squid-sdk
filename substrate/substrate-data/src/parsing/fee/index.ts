import {Bytes, Runtime} from '@subsquid/substrate-runtime'
import {assertNotNull} from '@subsquid/util-internal'
import {Event, Extrinsic} from '../../interfaces/data'
import {assertEvent, isEvent, UnexpectedEventType} from '../../types/util'
import {getFeeCalc} from './calc'
import {
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
            assertEvent(runtime, TransactionFeePaid, e)
            let actualFee = BigInt(e.args.actualFee)
            let tip = BigInt(e.args.tip)
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
    feeMultiplier: Bytes | undefined
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
