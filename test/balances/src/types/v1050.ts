import {sts, Result, Option, Bytes, BitSequence} from './support'

export type Releases = Releases_V1 | Releases_V10 | Releases_V2 | Releases_V3 | Releases_V4 | Releases_V5 | Releases_V6 | Releases_V7 | Releases_V8 | Releases_V9

export interface Releases_V1 {
    __kind: 'V1'
}

export interface Releases_V10 {
    __kind: 'V10'
}

export interface Releases_V2 {
    __kind: 'V2'
}

export interface Releases_V3 {
    __kind: 'V3'
}

export interface Releases_V4 {
    __kind: 'V4'
}

export interface Releases_V5 {
    __kind: 'V5'
}

export interface Releases_V6 {
    __kind: 'V6'
}

export interface Releases_V7 {
    __kind: 'V7'
}

export interface Releases_V8 {
    __kind: 'V8'
}

export interface Releases_V9 {
    __kind: 'V9'
}

export const Releases: sts.Type<Releases> = sts.closedEnum(() => {
    return  {
        V1: sts.unit(),
        V10: sts.unit(),
        V2: sts.unit(),
        V3: sts.unit(),
        V4: sts.unit(),
        V5: sts.unit(),
        V6: sts.unit(),
        V7: sts.unit(),
        V8: sts.unit(),
        V9: sts.unit(),
    }
})

export interface AccountData {
    free: Balance
    reserved: Balance
    miscFrozen: Balance
    feeFrozen: Balance
}

export type Balance = bigint

export const AccountData: sts.Type<AccountData> = sts.struct(() => {
    return  {
        free: Balance,
        reserved: Balance,
        miscFrozen: Balance,
        feeFrozen: Balance,
    }
})

export type AccountId = Bytes

export interface BalanceLock {
    id: LockIdentifier
    amount: Balance
    reasons: Reasons
}

export type Reasons = Reasons_All | Reasons_Fee | Reasons_Misc

export interface Reasons_All {
    __kind: 'All'
}

export interface Reasons_Fee {
    __kind: 'Fee'
}

export interface Reasons_Misc {
    __kind: 'Misc'
}

export type LockIdentifier = Bytes

export const BalanceLock: sts.Type<BalanceLock> = sts.struct(() => {
    return  {
        id: LockIdentifier,
        amount: Balance,
        reasons: Reasons,
    }
})

export const Reasons: sts.Type<Reasons> = sts.closedEnum(() => {
    return  {
        All: sts.unit(),
        Fee: sts.unit(),
        Misc: sts.unit(),
    }
})

export const LockIdentifier = sts.bytes()

export const LookupSource = sts.bytes()

export const Balance = sts.bigint()

export const AccountId = sts.bytes()
