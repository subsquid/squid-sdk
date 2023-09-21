import {sts} from '../../pallet.support'
import {AccountId32, Id, Type_55} from './types'

/**
 * Withdrew full balance of a contributor.
 */
export type CrowdloanWithdrewEvent = {
    who: AccountId32,
    fundIndex: Id,
    amount: bigint,
}

export const CrowdloanWithdrewEvent: sts.Type<CrowdloanWithdrewEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        fundIndex: Id,
        amount: sts.bigint(),
    }
})

/**
 * The loans in a fund have been partially dissolved, i.e. there are some left
 * over child keys that still need to be killed.
 */
export type CrowdloanPartiallyRefundedEvent = {
    paraId: Id,
}

export const CrowdloanPartiallyRefundedEvent: sts.Type<CrowdloanPartiallyRefundedEvent> = sts.struct(() => {
    return  {
        paraId: Id,
    }
})

/**
 * A memo has been updated.
 */
export type CrowdloanMemoUpdatedEvent = {
    who: AccountId32,
    paraId: Id,
    memo: Bytes,
}

export const CrowdloanMemoUpdatedEvent: sts.Type<CrowdloanMemoUpdatedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        paraId: Id,
        memo: sts.bytes(),
    }
})

/**
 * The result of trying to submit a new bid to the Slots pallet.
 */
export type CrowdloanHandleBidResultEvent = {
    paraId: Id,
    result: Type_55,
}

export const CrowdloanHandleBidResultEvent: sts.Type<CrowdloanHandleBidResultEvent> = sts.struct(() => {
    return  {
        paraId: Id,
        result: Type_55,
    }
})

/**
 * The configuration to a crowdloan has been edited.
 */
export type CrowdloanEditedEvent = {
    paraId: Id,
}

export const CrowdloanEditedEvent: sts.Type<CrowdloanEditedEvent> = sts.struct(() => {
    return  {
        paraId: Id,
    }
})

/**
 * Fund is dissolved.
 */
export type CrowdloanDissolvedEvent = {
    paraId: Id,
}

export const CrowdloanDissolvedEvent: sts.Type<CrowdloanDissolvedEvent> = sts.struct(() => {
    return  {
        paraId: Id,
    }
})

/**
 * Create a new crowdloaning campaign.
 */
export type CrowdloanCreatedEvent = {
    paraId: Id,
}

export const CrowdloanCreatedEvent: sts.Type<CrowdloanCreatedEvent> = sts.struct(() => {
    return  {
        paraId: Id,
    }
})

/**
 * Contributed to a crowd sale.
 */
export type CrowdloanContributedEvent = {
    who: AccountId32,
    fundIndex: Id,
    amount: bigint,
}

export const CrowdloanContributedEvent: sts.Type<CrowdloanContributedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        fundIndex: Id,
        amount: sts.bigint(),
    }
})

/**
 * All loans in a fund have been refunded.
 */
export type CrowdloanAllRefundedEvent = {
    paraId: Id,
}

export const CrowdloanAllRefundedEvent: sts.Type<CrowdloanAllRefundedEvent> = sts.struct(() => {
    return  {
        paraId: Id,
    }
})

/**
 * A parachain has been moved to `NewRaise`
 */
export type CrowdloanAddedToNewRaiseEvent = {
    paraId: Id,
}

export const CrowdloanAddedToNewRaiseEvent: sts.Type<CrowdloanAddedToNewRaiseEvent> = sts.struct(() => {
    return  {
        paraId: Id,
    }
})
