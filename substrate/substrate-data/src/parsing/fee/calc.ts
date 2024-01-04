import {Bytes, QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import {def} from '@subsquid/util-internal'
import {CalcFee as SubstrateFeeCalc} from '@substrate/calc'
import {STORAGE} from '../../storage'
import {
    BlockWeightsConst,
    ExtrinsicBaseWeightConst,
    IDispatchInfo,
    LengthToFeeConst,
    NextFeeMultiplier,
    TransactionByteFeeConst,
    WeightToFeeConst
} from './types'


export interface Calc {
    (dispatchInfo: IDispatchInfo, len: number): bigint | undefined
}


export function supportsFeeCalc(runtime: Runtime): boolean {
    return getFactory(runtime).isAvailable()
}


export function getFeeCalc(
    runtime: Runtime,
    feeMultiplier: number | bigint,
    specName: string,
    specVersion: number
): Calc | undefined {
    return getFactory(runtime).get(feeMultiplier, specName, specVersion)
}


const cache = new WeakMap<Runtime, CalcFactory>()


function getFactory(runtime: Runtime): CalcFactory {
    let factory = cache.get(runtime)
    if (factory == null) {
        factory = new CalcFactory(runtime)
        cache.set(runtime, factory)
    }
    return factory
}


interface CalcCoefficient {
    coeffInteger: string
    coeffFrac: number
    negative: boolean
    degree: number
}


interface BaseWeights {
    Normal: bigint
    Operational: bigint
    Mandatory: bigint
}


class CalcFactory {
    constructor(private runtime: Runtime) {}

    @def
    isAvailable(): boolean {
        return this.hasNextFeeMultiplier()
            && this.baseWeights() != null
            && this.createCalc(1, this.runtime.specName, this.runtime.specVersion) != null
    }

    @def
    private hasNextFeeMultiplier(): boolean {
        return STORAGE.nextFeeMultiplier.check(this.runtime)
    }

    get(
        feeMultiplier: number | bigint,
        specName: string,
        specVersion: number
    ): Calc | undefined {
        if (!this.hasNextFeeMultiplier()) return

        const baseWeights = this.baseWeights()
        if (baseWeights == null) return

        const calc = this.createCalc(feeMultiplier, specName, specVersion)
        if (calc == null) return

        return (dispatchInfo, len) => {
            if (!paysFee(dispatchInfo)) return undefined
            let baseWeight = baseWeights[dispatchInfo.class.__kind]
            let fee = calc.calc_fee(dispatchInfo.weight, len, baseWeight)
            return BigInt(fee)
        }
    }

    private createCalc(
        feeMultiplier: number | bigint,
        specName: string,
        specVersion: number
    ): SubstrateFeeCalc | undefined {
        let coefficients = this.coefficients()
        if (coefficients == null) return

        let perByteFee = this.perByteFee()
        if (perByteFee == null) return

        return SubstrateFeeCalc.from_params(
            coefficients,
            feeMultiplier.toString(),
            perByteFee.toString(),
            specName,
            specVersion
        )
    }

    @def
    perByteFee(): bigint | number | undefined {
        let val = this.getConst('TransactionPayment.TransactionByteFee', TransactionByteFeeConst)
        if (val != null) return val
        let lengthToFee = this.getConst('TransactionPayment.LengthToFee', LengthToFeeConst)
        return lengthToFee?.[0].coeffInteger
    }

    @def
    baseWeights(): BaseWeights | undefined {
        let perClass = this.getConst('System.BlockWeights', BlockWeightsConst)
        if (perClass) return {
            Normal: BigInt(perClass.perClass.normal.baseExtrinsic),
            Operational: BigInt(perClass.perClass.operational.baseExtrinsic),
            Mandatory: BigInt(perClass.perClass.mandatory.baseExtrinsic)
        }
        let baseWeight = this.getConst('System.ExtrinsicBaseWeight', ExtrinsicBaseWeightConst)
        if (baseWeight) return {
            Normal: BigInt(baseWeight),
            Operational: BigInt(baseWeight),
            Mandatory: BigInt(baseWeight)
        }
    }

    @def
    coefficients(): CalcCoefficient[] | undefined {
        let weightToFee = this.getConst('TransactionPayment.WeightToFee', WeightToFeeConst)
        return weightToFee?.map(c => {
            return {
                coeffInteger: String(c.coeffInteger),
                coeffFrac: c.coeffFrac,
                degree: c.degree,
                negative: c.negative
            }
        })
    }

    private getConst<T extends sts.Type>(name: QualifiedName, ty: T): sts.GetType<T> | undefined {
        if (this.runtime.checkConstantType(name, ty)) {
            return this.runtime.getConstant(name)
        }
    }
}


function paysFee(dispatchInfo: IDispatchInfo): boolean {
    if (typeof dispatchInfo.paysFee == 'boolean') {
        return dispatchInfo.paysFee
    } else {
        return dispatchInfo.paysFee.__kind == 'Yes'
    }
}

