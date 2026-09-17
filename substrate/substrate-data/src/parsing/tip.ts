import {Runtime} from '@subsquid/substrate-runtime'
import {Extrinsic} from '../interfaces/data'
import {GetType, numeric, struct, union} from '@subsquid/substrate-runtime/lib/sts'


const SignatureWithTip = struct({
    signedExtensions: struct({
        chargeTransactionPayment: union(numeric(), struct({tip: numeric()}))
    })
})


const GeneralExtensionsWithTip = struct({
    chargeAssetTxPayment: struct({
        tip: numeric()
    })
})


export function setExtrinsicTips(runtime: Runtime, extrinsics: Extrinsic[]): void {
    let signatureTips = runtime.checkType(runtime.description.signature, SignatureWithTip)
    let pipelineTips = checkVersionsWithTip(runtime)
    if (!signatureTips && !pipelineTips) return

    for (let ex of extrinsics) {
        if (ex.signature && signatureTips) {
            let tip = getSignedTip(ex.signature)
            if (tip != null) ex.tip = tip
        } else if (ex.extensionVersion != null && pipelineTips.has(ex.extensionVersion)) {
            let tip = getGeneralTip(ex.extensions)
            if (tip != null) ex.tip = tip
        }
    }
}


function checkVersionsWithTip(runtime: Runtime): Set<number> {
    let versions = new Set<number>()
    for (let [version, type] of Object.entries(runtime.description.generalExtensionsByVersion ?? {})) {
        if (runtime.checkType(type, GeneralExtensionsWithTip)) {
            versions.add(Number(version))
        }
    }
    return versions
}


function getSignedTip(signature: unknown): bigint | undefined {
    let payment = (signature as GetType<typeof SignatureWithTip>).signedExtensions.chargeTransactionPayment
    return typeof payment == 'object' ? BigInt(payment.tip) : BigInt(payment)
}


function getGeneralTip(extensions: unknown): bigint | undefined {
    let payment = (extensions as GetType<typeof GeneralExtensionsWithTip>).chargeAssetTxPayment
    return typeof payment == 'object' ? BigInt(payment.tip) : undefined
}
