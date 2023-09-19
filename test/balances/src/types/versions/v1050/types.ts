import * as sts from '@subsquid/substrate-runtime/lib/sts'

export const AccountId = sts.bytes()

export type AccountId = sts.GetType<typeof AccountId>

export const Balance = sts.bytes()

export type Balance = sts.GetType<typeof Balance>

export const LookupSource = sts.bytes()

export type LookupSource = sts.GetType<typeof LookupSource>

export const Type_21 = sts.bytes()

export type Type_21 = sts.GetType<typeof Type_21>

export const AccountData = sts.bytes()

export type AccountData = sts.GetType<typeof AccountData>

export const Type_291 = sts.bytes()

export type Type_291 = sts.GetType<typeof Type_291>

export const BalanceLock = sts.bytes()

export type BalanceLock = sts.GetType<typeof BalanceLock>

export const LockIdentifier = sts.bytes()

export type LockIdentifier = sts.GetType<typeof LockIdentifier>

export const Reasons = sts.bytes()

export type Reasons = sts.GetType<typeof Reasons>

export const Releases = sts.bytes()

export type Releases = sts.GetType<typeof Releases>
