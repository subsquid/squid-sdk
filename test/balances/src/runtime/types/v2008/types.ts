import {sts, Result, Option, Bytes} from '../../pallet.support'

export type BalanceStatus = BalanceStatus_Free | BalanceStatus_Reserved

export type BalanceStatus_Free = {
    __kind: 'Free'
}

export type BalanceStatus_Reserved = {
    __kind: 'Reserved'
}

export const BalanceStatus: sts.Type<BalanceStatus> = sts.closedEnum(() => {
    return {
        Free: sts.unit(),
        Reserved: sts.unit(),
    }
})

export type Balance = bigint

export const Balance: sts.Type<Balance> = sts.bigint()

export type AccountId = Bytes

export const AccountId: sts.Type<AccountId> = sts.bytes()
