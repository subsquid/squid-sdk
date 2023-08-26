import {
    any,
    array,
    bigint,
    boolean,
    bytes,
    closedEnum,
    GetType,
    number,
    numeric,
    openEnum,
    struct,
    tuple,
    union,
    unit,
    unknown
} from '@subsquid/substrate-runtime/lib/sts'


export const SystemOrigin = closedEnum({
    Signed: bytes(),
    Root: unit(),
    None: unit()
})


export const Origin = openEnum({
    system: SystemOrigin
})


export type IOrigin = GetType<typeof Origin>


export const Address = union(
    bytes(),
    openEnum({
        Id: bytes()
    }),
    openEnum({
        AccountId: bytes()
    })
)


export type IAddress = GetType<typeof Address>


export const Signature_PartTip = struct({
    signedExtensions: struct({
        ChargeTransactionPayment: union(numeric(), struct({tip: numeric()}))
    })
})


export type ISignature_PartTip = GetType<typeof Signature_PartTip>


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
        dispatchInfo: DispatchInfo,
        dispatchError: unknown()
    }),
    tuple(unknown(), DispatchInfo)
)


export const ExtrinsicFailed_PartError = union(
    struct({dispatchError: any()}),
    tuple(any(), any())
)
