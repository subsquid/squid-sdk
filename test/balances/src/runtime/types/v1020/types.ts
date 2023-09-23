import {sts, Result, Option, Bytes} from '../../pallet.support'

export type Balance = bigint

export const Balance: sts.Type<Balance> = sts.bigint()

export type AccountId = Bytes

export const AccountId: sts.Type<AccountId> = sts.bytes()
