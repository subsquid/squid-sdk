import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * We have ended a spend period and will now allocate funds.
 */
export type TreasurySpendingEvent = {
    budgetRemaining: bigint,
}

export const TreasurySpendingEvent: sts.Type<TreasurySpendingEvent> = sts.struct(() => {
    return  {
        budgetRemaining: sts.bigint(),
    }
})

/**
 * Spending has finished; this is the amount that rolls over until next spend.
 */
export type TreasuryRolloverEvent = {
    rolloverBalance: bigint,
}

export const TreasuryRolloverEvent: sts.Type<TreasuryRolloverEvent> = sts.struct(() => {
    return  {
        rolloverBalance: sts.bigint(),
    }
})

/**
 * A proposal was rejected; funds were slashed.
 */
export type TreasuryRejectedEvent = {
    proposalIndex: number,
    slashed: bigint,
}

export const TreasuryRejectedEvent: sts.Type<TreasuryRejectedEvent> = sts.struct(() => {
    return  {
        proposalIndex: sts.number(),
        slashed: sts.bigint(),
    }
})

/**
 * New proposal.
 */
export type TreasuryProposedEvent = {
    proposalIndex: number,
}

export const TreasuryProposedEvent: sts.Type<TreasuryProposedEvent> = sts.struct(() => {
    return  {
        proposalIndex: sts.number(),
    }
})

/**
 * Some funds have been deposited.
 */
export type TreasuryDepositEvent = {
    value: bigint,
}

export const TreasuryDepositEvent: sts.Type<TreasuryDepositEvent> = sts.struct(() => {
    return  {
        value: sts.bigint(),
    }
})

/**
 * Some of our funds have been burnt.
 */
export type TreasuryBurntEvent = {
    burntFunds: bigint,
}

export const TreasuryBurntEvent: sts.Type<TreasuryBurntEvent> = sts.struct(() => {
    return  {
        burntFunds: sts.bigint(),
    }
})

/**
 * Some funds have been allocated.
 */
export type TreasuryAwardedEvent = {
    proposalIndex: number,
    award: bigint,
    account: AccountId32,
}

export const TreasuryAwardedEvent: sts.Type<TreasuryAwardedEvent> = sts.struct(() => {
    return  {
        proposalIndex: sts.number(),
        award: sts.bigint(),
        account: AccountId32,
    }
})
