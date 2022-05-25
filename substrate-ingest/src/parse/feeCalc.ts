import {assertNotNull} from "@subsquid/util-internal"
import {CalcFee as SubstrateFeeCalc} from "@substrate/calc"
import {Spec, sub} from "../interfaces"
import {splitSpecId} from "../util"


interface BaseWeights {
    Normal: bigint
    Operational: bigint
    Mandatory: bigint
}


export class FeeCalc {
    static hasFeeMultiplier(spec: Spec): boolean {
        return spec.description.storage.TransactionPayment?.NextFeeMultiplier != null
    }

    static get(spec: Spec, rawMultiplier: string): FeeCalc | undefined {
        let perByte = getPerByteFee(spec)
        if (perByte == null) return
        let coefficients = getCoefficients(spec)
        if (coefficients == null) return
        let baseWeights = getBaseWeights(spec)
        if (baseWeights == null) return
        let multiplier = decodeFeeMultiplier(spec, rawMultiplier)
        let [specName, specVersion] = splitSpecId(spec.specId)
        let calc = SubstrateFeeCalc.from_params(
            coefficients,
            multiplier.toString(),
            perByte.toString(),
            specName,
            specVersion
        )
        if (calc == null) return
        return new FeeCalc(calc, baseWeights)
    }

    constructor(
        private calc: SubstrateFeeCalc,
        private baseWeights: BaseWeights
    ) {
    }

    calcFee(dispatchInfo: sub.DispatchInfo, len: number): bigint | undefined {
        if (!paysFee(dispatchInfo)) return undefined
        let baseWeight = this.baseWeights[dispatchInfo.class.__kind]
        let fee = this.calc.calc_fee(dispatchInfo.weight, len, baseWeight)
        return BigInt(fee)
    }
}


function paysFee(dispatchInfo: sub.DispatchInfo): boolean {
    if (typeof dispatchInfo.paysFee == 'boolean') {
        return dispatchInfo.paysFee
    } else {
        return dispatchInfo.paysFee.__kind == 'Yes'
    }
}


function decodeFeeMultiplier(spec: Spec, rawMultiplier: string): any {
    let item = assertNotNull(spec.description.storage.TransactionPayment?.NextFeeMultiplier)
    return spec.scaleCodec.decodeBinary(item.value, rawMultiplier)
}


function getPerByteFee(spec: Spec): any | undefined {
    let val = getConst(spec, 'TransactionPayment', 'TransactionByteFee')
    if (val != null) return val
    let lengthToFee = getConst(spec, 'TransactionPayment', 'LengthToFee')
    return lengthToFee?.[0].coeffInteger
}


function getBaseWeights(spec: Spec): BaseWeights | undefined {
    let perClass = getConst(spec, 'System', 'BlockWeights') as {
        perClass: {
            normal: {baseExtrinsic: bigint | number}
            operational: {baseExtrinsic: bigint | number}
            mandatory: {baseExtrinsic: bigint | number}
        }
    } | undefined
    if (perClass) return {
        Normal: BigInt(perClass.perClass.normal.baseExtrinsic),
        Operational: BigInt(perClass.perClass.operational.baseExtrinsic),
        Mandatory: BigInt(perClass.perClass.mandatory.baseExtrinsic)
    }
    let baseWeight = getConst(spec, 'System', 'ExtrinsicBaseWeight')
    if (baseWeight) return {
        Normal: BigInt(baseWeight),
        Operational: BigInt(baseWeight),
        Mandatory: BigInt(baseWeight)
    }
}


function getCoefficients(spec: Spec): any[] | undefined {
    let weightToFee = getConst(spec, 'TransactionPayment', 'WeightToFee') as any[] | undefined
    return weightToFee?.map((c: any) => {
        return {
            coeffInteger: String(c.coeffInteger),
            coeffFrac: c.coeffFrac,
            degree: c.degree,
            negative: c.negative
        }
    })
}


function getConst(spec: Spec, pallet: string, name: string): any | undefined {
    let c = spec.description.constants[pallet]?.[name]
    if (c == null) return undefined
    return spec.scaleCodec.decodeBinary(c.type, c.value)
}
