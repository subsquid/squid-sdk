import {sts, Result, Option, Bytes} from '../../pallet.support'

export type MultiAddress = MultiAddress_Address20 | MultiAddress_Address32 | MultiAddress_Id | MultiAddress_Index | MultiAddress_Raw

export type MultiAddress_Address20 = {
    __kind: 'Address20'
    value: Bytes
}

export type MultiAddress_Address32 = {
    __kind: 'Address32'
    value: Bytes
}

export type MultiAddress_Id = {
    __kind: 'Id'
    value: AccountId32
}

export type MultiAddress_Index = {
    __kind: 'Index'
}

export type MultiAddress_Raw = {
    __kind: 'Raw'
    value: Bytes
}

export const MultiAddress: sts.Type<MultiAddress> = sts.closedEnum(() => {
    return {
        Address20: sts.bytes(),
        Address32: sts.bytes(),
        Id: AccountId32,
        Index: sts.unit(),
        Raw: sts.bytes(),
    }
})

export type AccountId32 = Bytes

export const AccountId32: sts.Type<AccountId32> = sts.bytes()
