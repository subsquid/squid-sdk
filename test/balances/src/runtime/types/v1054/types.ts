import {sts, Result, Option, Bytes} from '../../pallet.support'

export type AccountData = {
    free: Balance,
    reserved: Balance,
    miscFrozen: Balance,
    feeFrozen: Balance,
}

export const AccountData: sts.Type<AccountData> = sts.struct(() => {
    return {
        free: Balance,
        reserved: Balance,
        miscFrozen: Balance,
        feeFrozen: Balance,
    }
})

export type Balance = bigint

export const Balance: sts.Type<Balance> = sts.bigint()

export type BalanceLock = {
    id: LockIdentifier,
    amount: Balance,
    reasons: Reasons,
}

export const BalanceLock: sts.Type<BalanceLock> = sts.struct(() => {
    return {
        id: LockIdentifier,
        amount: Balance,
        reasons: Reasons,
    }
})

export type Reasons = Reasons_All | Reasons_Fee | Reasons_Misc

export type Reasons_All = {
    __kind: 'All'
}

export type Reasons_Fee = {
    __kind: 'Fee'
}

export type Reasons_Misc = {
    __kind: 'Misc'
}

export const Reasons: sts.Type<Reasons> = sts.closedEnum(() => {
    return {
        All: sts.unit(),
        Fee: sts.unit(),
        Misc: sts.unit(),
    }
})

export type LockIdentifier = Bytes

export const LockIdentifier: sts.Type<LockIdentifier> = sts.bytes()

export type AccountId = Bytes

export const AccountId: sts.Type<AccountId> = sts.bytes()
