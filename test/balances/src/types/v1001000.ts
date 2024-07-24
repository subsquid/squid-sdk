import {sts, Result, Option, Bytes, BitSequence} from './support'

export interface Type_566 {
    id: RuntimeFreezeReason
    amount: bigint
}

export type RuntimeFreezeReason = RuntimeFreezeReason_NominationPools

export interface RuntimeFreezeReason_NominationPools {
    __kind: 'NominationPools'
    value: FreezeReason
}

export type FreezeReason = FreezeReason_PoolMinBalance

export interface FreezeReason_PoolMinBalance {
    __kind: 'PoolMinBalance'
}

export const Type_566: sts.Type<Type_566> = sts.struct(() => {
    return  {
        id: RuntimeFreezeReason,
        amount: sts.bigint(),
    }
})

export const RuntimeFreezeReason: sts.Type<RuntimeFreezeReason> = sts.closedEnum(() => {
    return  {
        NominationPools: FreezeReason,
    }
})

export const FreezeReason: sts.Type<FreezeReason> = sts.closedEnum(() => {
    return  {
        PoolMinBalance: sts.unit(),
    }
})

export type AccountId32 = Bytes

export interface IdAmount {
    id: RuntimeHoldReason
    amount: bigint
}

export type RuntimeHoldReason = RuntimeHoldReason_Nis | RuntimeHoldReason_Preimage

export interface RuntimeHoldReason_Nis {
    __kind: 'Nis'
    value: Type_563
}

export interface RuntimeHoldReason_Preimage {
    __kind: 'Preimage'
    value: HoldReason
}

export type HoldReason = HoldReason_Preimage

export interface HoldReason_Preimage {
    __kind: 'Preimage'
}

export type Type_563 = Type_563_NftReceipt

export interface Type_563_NftReceipt {
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
        Nis: Type_563,
        Preimage: HoldReason,
    }
})

export const HoldReason: sts.Type<HoldReason> = sts.closedEnum(() => {
    return  {
        Preimage: sts.unit(),
    }
})

export const Type_563: sts.Type<Type_563> = sts.closedEnum(() => {
    return  {
        NftReceipt: sts.unit(),
    }
})

export const AccountId32 = sts.bytes()
