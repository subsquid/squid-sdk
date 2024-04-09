import {
    array,
    bigint,
    boolean,
    closedEnum,
    GetType,
    number,
    numeric,
    struct,
    tuple,
    union,
    unit,
    unknown
} from '@subsquid/substrate-runtime/lib/sts'


export const NextFeeMultiplier = numeric()
export const TransactionByteFeeConst = numeric()
export const ExtrinsicBaseWeightConst = numeric()


const WeightToFeeCoefficient = struct({
    coeffInteger: numeric(),
    coeffFrac: number(),
    negative: boolean(),
    degree: number()
})


export const WeightToFeeConst = array(WeightToFeeCoefficient)
export const LengthToFeeConst = WeightToFeeConst


const BaseWeight = struct({
    baseExtrinsic: numeric()
})


export const BlockWeightsConst = struct({
    perClass: struct({
        normal: BaseWeight,
        operational: BaseWeight,
        mandatory: BaseWeight
    })
})


export const DispatchInfo = struct({
    weight: bigint(),
    class: closedEnum({
        Normal: unit(),
        Operational: unit(),
        Mandatory: unit()
    }),
    paysFee: union(
        boolean(),
        closedEnum({
            Yes: unit(),
            No: unit()
        })
    )
})


export type IDispatchInfo = GetType<typeof DispatchInfo>


export const ExtrinsicSuccessLatest = struct({
    dispatchInfo: DispatchInfo
})


export const ExtrinsicSuccessLegacy = DispatchInfo


export const ExtrinsicFailed = union(
    struct({
        dispatchInfo: DispatchInfo
    }),
    tuple([unknown(), DispatchInfo])
)


export const TransactionFeePaid = struct({
    actualFee: numeric(),
    tip: numeric()
})


export const AcalaTransactionFeePaid = struct({
    actualFee: numeric(),
    actualTip: numeric()
})
