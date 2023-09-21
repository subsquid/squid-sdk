import {sts} from '../../pallet.support'
import {H256, AccountId32} from './types'

/**
 * A tip suggestion has been slashed.
 */
export type TipsTipSlashedEvent = {
    tipHash: H256,
    finder: AccountId32,
    deposit: bigint,
}

export const TipsTipSlashedEvent: sts.Type<TipsTipSlashedEvent> = sts.struct(() => {
    return  {
        tipHash: H256,
        finder: AccountId32,
        deposit: sts.bigint(),
    }
})

/**
 * A tip suggestion has been retracted.
 */
export type TipsTipRetractedEvent = {
    tipHash: H256,
}

export const TipsTipRetractedEvent: sts.Type<TipsTipRetractedEvent> = sts.struct(() => {
    return  {
        tipHash: H256,
    }
})

/**
 * A tip suggestion has reached threshold and is closing.
 */
export type TipsTipClosingEvent = {
    tipHash: H256,
}

export const TipsTipClosingEvent: sts.Type<TipsTipClosingEvent> = sts.struct(() => {
    return  {
        tipHash: H256,
    }
})

/**
 * A tip suggestion has been closed.
 */
export type TipsTipClosedEvent = {
    tipHash: H256,
    who: AccountId32,
    payout: bigint,
}

export const TipsTipClosedEvent: sts.Type<TipsTipClosedEvent> = sts.struct(() => {
    return  {
        tipHash: H256,
        who: AccountId32,
        payout: sts.bigint(),
    }
})

/**
 * A new tip suggestion has been opened.
 */
export type TipsNewTipEvent = {
    tipHash: H256,
}

export const TipsNewTipEvent: sts.Type<TipsNewTipEvent> = sts.struct(() => {
    return  {
        tipHash: H256,
    }
})
