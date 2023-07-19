import type {Bytes} from '@subsquid/substrate-metadata'
import {assertNotNull, def} from '@subsquid/util-internal'
import {CalcFee as SubstrateFeeCalc} from '@substrate/calc'
import assert from 'assert'
import {DispatchInfo} from '../interfaces/data-decoded'
import {Runtime} from '../runtime'


export interface FeeCalc {
    (dispatchInfo: DispatchInfo, len: number): bigint | undefined
}


export function supportsFeeCalc(runtime: Runtime): boolean {
    return getFactory(runtime).isAvailable()
}


export function getFeeCalc(runtime: Runtime, feeMultiplier: Bytes): FeeCalc {
    return getFactory(runtime).get(feeMultiplier)
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


class CalcFactory {
    constructor(private runtime: Runtime) {}

    @def
    isAvailable(): boolean {
        if (!this.runtime.hasStorageItem('TransactionPayment', 'NextFeeMultiplier')) return false
        if (this.perByteFee() == null) return false
        if (this.baseWeights() == null) return false
        if (this.coefficients() == null) return false
        return this.createCalc(1) != null
    }

    get(feeMultiplier: Bytes): FeeCalc {
        assert(this.isAvailable())
        let multiplier = this.runtime.decodeStorageValue('TransactionPayment.NextFeeMultiplier', feeMultiplier)
        let calc = assertNotNull(this.createCalc(multiplier))
        let baseWeights = this.baseWeights()
        return (dispatchInfo, len) => {
            if (!paysFee(dispatchInfo)) return undefined
            let baseWeight = baseWeights[dispatchInfo.class.__kind]
            let fee = calc.calc_fee(dispatchInfo.weight, len, baseWeight)
            return BigInt(fee)
        }
    }

    private createCalc(feeMultiplier: number | bigint): SubstrateFeeCalc | undefined {
        return SubstrateFeeCalc.from_params(
            this.coefficients(),
            feeMultiplier.toString(),
            this.perByteFee().toString(),
            this.runtime.specName,
            this.runtime.specVersion
        )
    }

    @def
    perByteFee(): any | undefined {
        let val = this.getConst('TransactionPayment', 'TransactionByteFee')
        if (val != null) return val
        let lengthToFee = this.getConst('TransactionPayment', 'LengthToFee')
        return lengthToFee?.[0].coeffInteger
    }

    @def
    baseWeights(): any | undefined {
        let perClass = this.getConst('System', 'BlockWeights') as {
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
        let baseWeight = this.getConst('System', 'ExtrinsicBaseWeight')
        if (baseWeight) return {
            Normal: BigInt(baseWeight),
            Operational: BigInt(baseWeight),
            Mandatory: BigInt(baseWeight)
        }
    }

    @def
    coefficients(): any[] | undefined {
        let weightToFee = this.getConst('TransactionPayment', 'WeightToFee') as any[] | undefined
        return weightToFee?.map((c: any) => {
            return {
                coeffInteger: String(c.coeffInteger),
                coeffFrac: c.coeffFrac,
                degree: c.degree,
                negative: c.negative
            }
        })
    }

    private getConst(pallet: string, name: string): any | undefined {
        if (this.runtime.hasConstant(pallet, name)) {
            return this.runtime.getConstant(pallet, name)
        }
    }
}


function paysFee(dispatchInfo: DispatchInfo): boolean {
    if (typeof dispatchInfo.paysFee == 'boolean') {
        return dispatchInfo.paysFee
    } else {
        return dispatchInfo.paysFee.__kind == 'Yes'
    }
}
