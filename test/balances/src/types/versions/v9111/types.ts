import * as sts from '@subsquid/substrate-runtime/lib/sts'

export const MultiAddress = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type MultiAddress = sts.GetType<typeof MultiAddress>

export const Type_64 = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type Type_64 = sts.GetType<typeof Type_64>

export const Type_1 = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type Type_1 = sts.GetType<typeof Type_1>

export const AccountId32 = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type AccountId32 = sts.GetType<typeof AccountId32>

export const Type_196 = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type Type_196 = sts.GetType<typeof Type_196>

export const Type_10 = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type Type_10 = sts.GetType<typeof Type_10>

export const Type_46 = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type Type_46 = sts.GetType<typeof Type_46>

export const Type_6 = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type Type_6 = sts.GetType<typeof Type_6>

export const Type_55 = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type Type_55 = sts.GetType<typeof Type_55>

export const Releases = sts.closedEnum(() => ({Address20: Type_64, Address32: Type_1, Id: AccountId32, Index: Type_196, Raw: Type_10}))

export type Releases = sts.GetType<typeof Releases>
