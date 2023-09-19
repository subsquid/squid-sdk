import * as sts from '@subsquid/substrate-runtime/lib/sts'

export const AccountId = sts.bytes()

export type AccountId = sts.GetType<typeof AccountId>

export const Balance = sts.bytes()

export type Balance = sts.GetType<typeof Balance>

export const BalanceStatus = sts.bytes()

export type BalanceStatus = sts.GetType<typeof BalanceStatus>
