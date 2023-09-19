import * as sts from '@subsquid/substrate-runtime/lib/sts'

export const AccountId32 = sts.bytes()

export type AccountId32 = sts.GetType<typeof AccountId32>

export const Type_6 = sts.bytes()

export type Type_6 = sts.GetType<typeof Type_6>

export const BalanceStatus = sts.bytes()

export type BalanceStatus = sts.GetType<typeof BalanceStatus>
