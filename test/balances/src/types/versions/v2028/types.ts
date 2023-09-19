import * as sts from '@subsquid/substrate-runtime/lib/sts'

export const LookupSource = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type LookupSource = sts.GetType<typeof LookupSource>

export const H160 = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type H160 = sts.GetType<typeof H160>

export const H256 = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type H256 = sts.GetType<typeof H256>

export const AccountId = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type AccountId = sts.GetType<typeof AccountId>

export const Type_8 = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type Type_8 = sts.GetType<typeof Type_8>

export const AccountIndex = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type AccountIndex = sts.GetType<typeof AccountIndex>

export const Type_12 = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type Type_12 = sts.GetType<typeof Type_12>

export const Type_29 = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type Type_29 = sts.GetType<typeof Type_29>

export const Balance = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type Balance = sts.GetType<typeof Balance>
