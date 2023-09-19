import * as sts from '@subsquid/substrate-runtime/lib/sts'

/**
 * A balance was set by root.
 */
export const BalancesBalanceSetEvent = sts.struct(() => ({who: AccountId32, free: Type_6, reserved: Type_6}))

export type BalancesBalanceSetEvent = sts.GetType<typeof BalancesBalanceSetEvent>

/**
 * Some amount was deposited (e.g. for transaction fees).
 */
export const BalancesDepositEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesDepositEvent = sts.GetType<typeof BalancesDepositEvent>

/**
 * An account was removed whose balance was non-zero but below ExistentialDeposit,
 * resulting in an outright loss.
 */
export const BalancesDustLostEvent = sts.struct(() => ({account: AccountId32, amount: Type_6}))

export type BalancesDustLostEvent = sts.GetType<typeof BalancesDustLostEvent>

/**
 * An account was created with some free balance.
 */
export const BalancesEndowedEvent = sts.struct(() => ({account: AccountId32, freeBalance: Type_6}))

export type BalancesEndowedEvent = sts.GetType<typeof BalancesEndowedEvent>

/**
 * Some balance was moved from the reserve of the first account to the second account.
 * Final argument indicates the destination balance type.
 */
export const BalancesReserveRepatriatedEvent = sts.struct(() => ({from: AccountId32, to: AccountId32, amount: Type_6, destinationStatus: BalanceStatus}))

export type BalancesReserveRepatriatedEvent = sts.GetType<typeof BalancesReserveRepatriatedEvent>

/**
 * Some balance was reserved (moved from free to reserved).
 */
export const BalancesReservedEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesReservedEvent = sts.GetType<typeof BalancesReservedEvent>

/**
 * Some amount was removed from the account (e.g. for misbehavior).
 */
export const BalancesSlashedEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesSlashedEvent = sts.GetType<typeof BalancesSlashedEvent>

/**
 * Transfer succeeded.
 */
export const BalancesTransferEvent = sts.struct(() => ({from: AccountId32, to: AccountId32, amount: Type_6}))

export type BalancesTransferEvent = sts.GetType<typeof BalancesTransferEvent>

/**
 * Some balance was unreserved (moved from reserved to free).
 */
export const BalancesUnreservedEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesUnreservedEvent = sts.GetType<typeof BalancesUnreservedEvent>

/**
 * Some amount was withdrawn from the account (e.g. for transaction fees).
 */
export const BalancesWithdrawEvent = sts.struct(() => ({who: AccountId32, amount: Type_6}))

export type BalancesWithdrawEvent = sts.GetType<typeof BalancesWithdrawEvent>
