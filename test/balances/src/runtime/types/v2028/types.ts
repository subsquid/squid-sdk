import {sts, Result, Option, Bytes} from '../../pallet.support'

export type LookupSource = LookupSource_Address20 | LookupSource_Address32 | LookupSource_Id | LookupSource_Index | LookupSource_Raw

export type LookupSource_Address20 = {
    __kind: 'Address20'
    value: H160
}

export type LookupSource_Address32 = {
    __kind: 'Address32'
    value: H256
}

export type LookupSource_Id = {
    __kind: 'Id'
    value: AccountId
}

export type LookupSource_Index = {
    __kind: 'Index'
    value: number
}

export type LookupSource_Raw = {
    __kind: 'Raw'
    value: Bytes
}

export const LookupSource: sts.Type<LookupSource> = sts.closedEnum(() => {
    return {
        Address20: H160,
        Address32: H256,
        Id: AccountId,
        Index: sts.number(),
        Raw: sts.bytes(),
    }
})

export type AccountId = Bytes

export const AccountId: sts.Type<AccountId> = sts.bytes()

export type H256 = Bytes

export const H256: sts.Type<H256> = sts.bytes()

export type H160 = Bytes

export const H160: sts.Type<H160> = sts.bytes()
