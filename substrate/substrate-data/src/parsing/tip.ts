import {Runtime} from '@subsquid/substrate-runtime'
import {Extrinsic} from '../interfaces/data'
import {GetType, numeric, struct, union} from '@subsquid/substrate-runtime/lib/sts'


const SignatureWithTip = struct({
    signedExtensions: struct({
        chargeTransactionPayment: union(numeric(), struct({tip: numeric()}))
    })
})


export function setExtrinsicTips(runtime: Runtime, extrinsics: Extrinsic[]): void {
    if (!runtime.checkType(runtime.description.signature, SignatureWithTip)) return
    for (let ex of extrinsics) {
        if (ex.signature) {
            let signature = ex.signature as GetType<typeof SignatureWithTip>
            if (typeof signature.signedExtensions.chargeTransactionPayment == 'object') {
                ex.tip = BigInt(signature.signedExtensions.chargeTransactionPayment.tip)
            } else {
                ex.tip = BigInt(signature.signedExtensions.chargeTransactionPayment)
            }
        }
    }
}
