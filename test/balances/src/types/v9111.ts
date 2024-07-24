import {sts, Result, Option, Bytes, BitSequence} from './support'

export type Releases = Releases_V1_0_0 | Releases_V2_0_0

export interface Releases_V1_0_0 {
    __kind: 'V1_0_0'
}

export interface Releases_V2_0_0 {
    __kind: 'V2_0_0'
}

export const Releases: sts.Type<Releases> = sts.closedEnum(() => {
    return  {
        V1_0_0: sts.unit(),
        V2_0_0: sts.unit(),
    }
})

export const MultiAddress: sts.Type<MultiAddress> = sts.closedEnum(() => {
    return  {
        Address20: sts.bytes(),
        Address32: sts.bytes(),
        Id: AccountId32,
        Index: sts.unit(),
        Raw: sts.bytes(),
    }
})

export const AccountId32 = sts.bytes()

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

export type AccountId32 = Bytes
