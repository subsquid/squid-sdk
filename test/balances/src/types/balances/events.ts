import {sts, Block, Bytes, Option, Result, EventType, event, RuntimeCtx} from '../support'
import * as v1020 from '../v1020'
import * as v1031 from '../v1031'
import * as v1032 from '../v1032'
import * as v1050 from '../v1050'
import * as v2008 from '../v2008'
import * as v9122 from '../v9122'
import * as v9130 from '../v9130'
import * as v9420 from '../v9420'

export const newAccount = event('Balances.NewAccount', {
    /**
     *  A new account was created.
     */
    v1020: sts.tuple([v1020.AccountId, v1020.Balance]),
})

export const reapedAccount = event('Balances.ReapedAccount', {
    /**
     *  An account was reaped.
     */
    v1020: v1020.AccountId,
    /**
     *  An account was reaped.
     */
    v1031: sts.tuple([v1031.AccountId, v1031.Balance]),
})

export const transfer = event('Balances.Transfer', {
    /**
     *  Transfer succeeded (from, to, value, fees).
     */
    v1020: sts.tuple([v1020.AccountId, v1020.AccountId, v1020.Balance, v1020.Balance]),
    /**
     *  Transfer succeeded (from, to, value).
     */
    v1050: sts.tuple([v1050.AccountId, v1050.AccountId, v1050.Balance]),
    /**
     * Transfer succeeded.
     */
    v9130: sts.struct({
        from: v9130.AccountId32,
        to: v9130.AccountId32,
        amount: sts.bigint(),
    }),
})

export const balanceSet = event('Balances.BalanceSet', {
    /**
     *  A balance was set by root (who, free, reserved).
     */
    v1031: sts.tuple([v1031.AccountId, v1031.Balance, v1031.Balance]),
    /**
     * A balance was set by root.
     */
    v9130: sts.struct({
        who: v9130.AccountId32,
        free: sts.bigint(),
        reserved: sts.bigint(),
    }),
    /**
     * A balance was set by root.
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
        free: sts.bigint(),
    }),
})

export const deposit = event('Balances.Deposit', {
    /**
     *  Some amount was deposited (e.g. for transaction fees).
     */
    v1032: sts.tuple([v1032.AccountId, v1032.Balance]),
    /**
     * Some amount was deposited (e.g. for transaction fees).
     */
    v9130: sts.struct({
        who: v9130.AccountId32,
        amount: sts.bigint(),
    }),
})

export const endowed = event('Balances.Endowed', {
    /**
     *  An account was created with some free balance.
     */
    v1050: sts.tuple([v1050.AccountId, v1050.Balance]),
    /**
     * An account was created with some free balance.
     */
    v9130: sts.struct({
        account: v9130.AccountId32,
        freeBalance: sts.bigint(),
    }),
})

export const dustLost = event('Balances.DustLost', {
    /**
     *  An account was removed whose balance was non-zero but below ExistentialDeposit,
     *  resulting in an outright loss.
     */
    v1050: sts.tuple([v1050.AccountId, v1050.Balance]),
    /**
     * An account was removed whose balance was non-zero but below ExistentialDeposit,
     * resulting in an outright loss.
     */
    v9130: sts.struct({
        account: v9130.AccountId32,
        amount: sts.bigint(),
    }),
})

export const reserved = event('Balances.Reserved', {
    /**
     *  Some balance was reserved (moved from free to reserved).
     */
    v2008: sts.tuple([v2008.AccountId, v2008.Balance]),
    /**
     * Some balance was reserved (moved from free to reserved).
     */
    v9130: sts.struct({
        who: v9130.AccountId32,
        amount: sts.bigint(),
    }),
})

export const unreserved = event('Balances.Unreserved', {
    /**
     *  Some balance was unreserved (moved from reserved to free).
     */
    v2008: sts.tuple([v2008.AccountId, v2008.Balance]),
    /**
     * Some balance was unreserved (moved from reserved to free).
     */
    v9130: sts.struct({
        who: v9130.AccountId32,
        amount: sts.bigint(),
    }),
})

export const reserveRepatriated = event('Balances.ReserveRepatriated', {
    /**
     *  Some balance was moved from the reserve of the first account to the second account.
     *  Final argument indicates the destination balance type.
     */
    v2008: sts.tuple([v2008.AccountId, v2008.AccountId, v2008.Balance, v2008.BalanceStatus]),
    /**
     * Some balance was moved from the reserve of the first account to the second account.
     * Final argument indicates the destination balance type.
     */
    v9130: sts.struct({
        from: v9130.AccountId32,
        to: v9130.AccountId32,
        amount: sts.bigint(),
        destinationStatus: v9130.BalanceStatus,
    }),
})

export const withdraw = event('Balances.Withdraw', {
    /**
     * Some amount was withdrawn from the account (e.g. for transaction fees). \[who, value\]
     */
    v9122: sts.tuple([v9122.AccountId32, sts.bigint()]),
    /**
     * Some amount was withdrawn from the account (e.g. for transaction fees).
     */
    v9130: sts.struct({
        who: v9130.AccountId32,
        amount: sts.bigint(),
    }),
})

export const slashed = event('Balances.Slashed', {
    /**
     * Some amount was removed from the account (e.g. for misbehavior). \[who,
     * amount_slashed\]
     */
    v9122: sts.tuple([v9122.AccountId32, sts.bigint()]),
    /**
     * Some amount was removed from the account (e.g. for misbehavior).
     */
    v9130: sts.struct({
        who: v9130.AccountId32,
        amount: sts.bigint(),
    }),
})

export const minted = event('Balances.Minted', {
    /**
     * Some amount was minted into an account.
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
        amount: sts.bigint(),
    }),
})

export const burned = event('Balances.Burned', {
    /**
     * Some amount was burned from an account.
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
        amount: sts.bigint(),
    }),
})

export const suspended = event('Balances.Suspended', {
    /**
     * Some amount was suspended from an account (it can be restored later).
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
        amount: sts.bigint(),
    }),
})

export const restored = event('Balances.Restored', {
    /**
     * Some amount was restored into an account.
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
        amount: sts.bigint(),
    }),
})

export const upgraded = event('Balances.Upgraded', {
    /**
     * An account was upgraded.
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
    }),
})

export const issued = event('Balances.Issued', {
    /**
     * Total issuance was increased by `amount`, creating a credit to be balanced.
     */
    v9420: sts.struct({
        amount: sts.bigint(),
    }),
})

export const rescinded = event('Balances.Rescinded', {
    /**
     * Total issuance was decreased by `amount`, creating a debt to be balanced.
     */
    v9420: sts.struct({
        amount: sts.bigint(),
    }),
})

export const locked = event('Balances.Locked', {
    /**
     * Some balance was locked.
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
        amount: sts.bigint(),
    }),
})

export const unlocked = event('Balances.Unlocked', {
    /**
     * Some balance was unlocked.
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
        amount: sts.bigint(),
    }),
})

export const frozen = event('Balances.Frozen', {
    /**
     * Some balance was frozen.
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
        amount: sts.bigint(),
    }),
})

export const thawed = event('Balances.Thawed', {
    /**
     * Some balance was thawed.
     */
    v9420: sts.struct({
        who: v9420.AccountId32,
        amount: sts.bigint(),
    }),
})

export const totalIssuanceForced = event('Balances.TotalIssuanceForced', {
    /**
     * The `TotalIssuance` was forcefully changed.
     */
    v1002000: sts.struct({
        old: sts.bigint(),
        new: sts.bigint(),
    }),
})
