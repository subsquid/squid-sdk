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

export const Type_82 = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type Type_82 = sts.GetType<typeof Type_82>

export const Type_543 = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type Type_543 = sts.GetType<typeof Type_543>

export const ReserveData = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type ReserveData = sts.GetType<typeof ReserveData>

export const ReserveIdentifier = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type ReserveIdentifier = sts.GetType<typeof ReserveIdentifier>

export const Balance = sts.closedEnum(() => ({Address20: H160, Address32: H256, Id: AccountId, Index: Type_8, Raw: Type_12}))

export type Balance = sts.GetType<typeof Balance>
