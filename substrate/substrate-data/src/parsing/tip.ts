import {Runtime} from '@subsquid/substrate-runtime'
import {Extrinsic} from '../interfaces/data'
import {GetType, numeric, struct, union} from '@subsquid/substrate-runtime/lib/sts'


const SignatureWithTip = struct({
    signedExtensions: struct({
        ChargeTransactionPayment: union(numeric(), struct({tip: numeric()}))
    })
})


export function setExtrinsicTip(runtime: Runtime, extrinsics: Extrinsic[]): void {
    if (!runtime.checkType(runtime.description.signature, SignatureWithTip)) return
    for (let ex of extrinsics) {
        if (ex.signature) {
            let signature = ex.signature as GetType<typeof SignatureWithTip>
            if (typeof signature.signedExtensions.ChargeTransactionPayment == 'object') {
                ex.tip = BigInt(signature.signedExtensions.ChargeTransactionPayment.tip)
            } else {
                ex.tip = BigInt(signature.signedExtensions.ChargeTransactionPayment)
            }
        }
    }
}
