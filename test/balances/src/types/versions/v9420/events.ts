import * as sts from '@subsquid/substrate-runtime/lib/sts'

/**
 * A balance was set by root.
 */
export const BalancesBalanceSetEvent = sts.struct(() => ({who: AccountId32, free: Type_6}))

export type BalancesBalanceSetEvent = sts.GetType<typeof BalancesBalanceSetEvent>

/**
 * Some amount was burned from an account.
 */
export const BalancesBurnedEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesBurnedEvent = sts.GetType<typeof BalancesBurnedEvent>

/**
 * Some balance was frozen.
 */
export const BalancesFrozenEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesFrozenEvent = sts.GetType<typeof BalancesFrozenEvent>

/**
 * Total issuance was increased by `amount`, creating a credit to be balanced.
 */
export const BalancesIssuedEvent = sts.struct(() => ({amount: Type_6}))

export type BalancesIssuedEvent = sts.GetType<typeof BalancesIssuedEvent>

/**
 * Some balance was locked.
 */
export const BalancesLockedEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesLockedEvent = sts.GetType<typeof BalancesLockedEvent>

/**
 * Some amount was minted into an account.
 */
export const BalancesMintedEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesMintedEvent = sts.GetType<typeof BalancesMintedEvent>

/**
 * Total issuance was decreased by `amount`, creating a debt to be balanced.
 */
export const BalancesRescindedEvent = sts.struct(() => ({amount: Type_6}))

export type BalancesRescindedEvent = sts.GetType<typeof BalancesRescindedEvent>

/**
 * Some amount was restored into an account.
 */
export const BalancesRestoredEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesRestoredEvent = sts.GetType<typeof BalancesRestoredEvent>

/**
 * Some amount was suspended from an account (it can be restored later).
 */
export const BalancesSuspendedEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesSuspendedEvent = sts.GetType<typeof BalancesSuspendedEvent>

/**
 * Some balance was thawed.
 */
export const BalancesThawedEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesThawedEvent = sts.GetType<typeof BalancesThawedEvent>

/**
 * Some balance was unlocked.
 */
export const BalancesUnlockedEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesUnlockedEvent = sts.GetType<typeof BalancesUnlockedEvent>

/**
 * An account was upgraded.
 */
export const BalancesUpgradedEvent = sts.struct(() => ({who: AccountId32}))

export type BalancesUpgradedEvent = sts.GetType<typeof BalancesUpgradedEvent>
