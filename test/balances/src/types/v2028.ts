import {sts, Result, Option, Bytes, BitSequence} from './support'

export const LookupSource: sts.Type<LookupSource> = sts.closedEnum(() => {
    return  {
        Address20: H160,
        Address32: H256,
        Id: AccountId,
        Index: sts.number(),
        Raw: sts.bytes(),
    }
})

export const AccountId = sts.bytes()

export const H256 = sts.bytes()

export const H160 = sts.bytes()

export type LookupSource = LookupSource_Address20 | LookupSource_Address32 | LookupSource_Id | LookupSource_Index | LookupSource_Raw

export interface LookupSource_Address20 {
    __kind: 'Address20'
    value: H160
}

export interface LookupSource_Address32 {
    __kind: 'Address32'
    value: H256
}

export interface LookupSource_Id {
    __kind: 'Id'
    value: AccountId
}

export interface LookupSource_Index {
    __kind: 'Index'
    value: number
}

export interface LookupSource_Raw {
    __kind: 'Raw'
    value: Bytes
}

export type AccountId = Bytes

export type H256 = Bytes

export type H160 = Bytes
