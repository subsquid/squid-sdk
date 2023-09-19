import * as sts from '@subsquid/substrate-runtime/lib/sts'

export const AccountId = sts.bytes()

export type AccountId = sts.GetType<typeof AccountId>

export const Balance = sts.bytes()

export type Balance = sts.GetType<typeof Balance>

export const LookupSource = sts.bytes()

export type LookupSource = sts.GetType<typeof LookupSource>

export const Type_4 = sts.bytes()

export type Type_4 = sts.GetType<typeof Type_4>

export const Type_5 = sts.bytes()

export type Type_5 = sts.GetType<typeof Type_5>

export const Type_6 = sts.bytes()

export type Type_6 = sts.GetType<typeof Type_6>

export const Type_25 = sts.bytes()

export type Type_25 = sts.GetType<typeof Type_25>

export const Type_227 = sts.bytes()

export type Type_227 = sts.GetType<typeof Type_227>

export const BalanceLock = sts.bytes()

export type BalanceLock = sts.GetType<typeof BalanceLock>

export const LockIdentifier = sts.bytes()

export type LockIdentifier = sts.GetType<typeof LockIdentifier>

export const BlockNumber = sts.bytes()

export type BlockNumber = sts.GetType<typeof BlockNumber>

export const Type_232 = sts.bytes()

export type Type_232 = sts.GetType<typeof Type_232>

export const VestingSchedule = sts.bytes()

export type VestingSchedule = sts.GetType<typeof VestingSchedule>
