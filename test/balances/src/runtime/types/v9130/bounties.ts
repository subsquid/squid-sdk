import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * A bounty proposal was rejected; funds were slashed.
 */
export type BountiesBountyRejectedEvent = {
    index: number,
    bond: bigint,
}

export const BountiesBountyRejectedEvent: sts.Type<BountiesBountyRejectedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        bond: sts.bigint(),
    }
})

/**
 * New bounty proposal.
 */
export type BountiesBountyProposedEvent = {
    index: number,
}

export const BountiesBountyProposedEvent: sts.Type<BountiesBountyProposedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * A bounty expiry is extended.
 */
export type BountiesBountyExtendedEvent = {
    index: number,
}

export const BountiesBountyExtendedEvent: sts.Type<BountiesBountyExtendedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * A bounty is claimed by beneficiary.
 */
export type BountiesBountyClaimedEvent = {
    index: number,
    payout: bigint,
    beneficiary: AccountId32,
}

export const BountiesBountyClaimedEvent: sts.Type<BountiesBountyClaimedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        payout: sts.bigint(),
        beneficiary: AccountId32,
    }
})

/**
 * A bounty is cancelled.
 */
export type BountiesBountyCanceledEvent = {
    index: number,
}

export const BountiesBountyCanceledEvent: sts.Type<BountiesBountyCanceledEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * A bounty proposal is funded and became active.
 */
export type BountiesBountyBecameActiveEvent = {
    index: number,
}

export const BountiesBountyBecameActiveEvent: sts.Type<BountiesBountyBecameActiveEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * A bounty is awarded to a beneficiary.
 */
export type BountiesBountyAwardedEvent = {
    index: number,
    beneficiary: AccountId32,
}

export const BountiesBountyAwardedEvent: sts.Type<BountiesBountyAwardedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        beneficiary: AccountId32,
    }
})
