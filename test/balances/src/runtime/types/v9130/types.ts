import {sts, Result, Option, Bytes} from '../../pallet.support'

export type AccountId32 = Bytes

export const AccountId32: sts.Type<AccountId32> = sts.bytes()
