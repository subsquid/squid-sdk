import {sts, Result, Option, Bytes, BitSequence} from './support'

export interface Type_544 {
    amount: bigint
}

export const Type_544: sts.Type<Type_544> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
    }
})

export interface IdAmount {
    id: RuntimeHoldReason
    amount: bigint
}

export type RuntimeHoldReason = RuntimeHoldReason_Nis

export interface RuntimeHoldReason_Nis {
    __kind: 'Nis'
    value: HoldReason
}

export type HoldReason = HoldReason_NftReceipt

export interface HoldReason_NftReceipt {
    __kind: 'NftReceipt'
}

export const IdAmount: sts.Type<IdAmount> = sts.struct(() => {
    return  {
        id: RuntimeHoldReason,
        amount: sts.bigint(),
    }
})

export const RuntimeHoldReason: sts.Type<RuntimeHoldReason> = sts.closedEnum(() => {
    return  {
        Nis: HoldReason,
    }
})

export const HoldReason: sts.Type<HoldReason> = sts.closedEnum(() => {
    return  {
        NftReceipt: sts.unit(),
    }
})

export type AccountId32 = Bytes

export interface AccountData {
    free: bigint
    reserved: bigint
    frozen: bigint
    flags: ExtraFlags
}

export type ExtraFlags = bigint

export const AccountData: sts.Type<AccountData> = sts.struct(() => {
    return  {
        free: sts.bigint(),
        reserved: sts.bigint(),
        frozen: sts.bigint(),
        flags: ExtraFlags,
    }
})

export const ExtraFlags = sts.bigint()

export const MultiAddress: sts.Type<MultiAddress> = sts.closedEnum(() => {
    return  {
        Address20: sts.bytes(),
        Address32: sts.bytes(),
        Id: AccountId32,
        Index: sts.unit(),
        Raw: sts.bytes(),
    }
})

export type MultiAddress = MultiAddress_Address20 | MultiAddress_Address32 | MultiAddress_Id | MultiAddress_Index | MultiAddress_Raw

export interface MultiAddress_Address20 {
    __kind: 'Address20'
    value: Bytes
}

export interface MultiAddress_Address32 {
    __kind: 'Address32'
    value: Bytes
}

export interface MultiAddress_Id {
    __kind: 'Id'
    value: AccountId32
}

export interface MultiAddress_Index {
    __kind: 'Index'
}

export interface MultiAddress_Raw {
    __kind: 'Raw'
    value: Bytes
}

export const AccountId32 = sts.bytes()
