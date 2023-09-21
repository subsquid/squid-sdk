import {sts} from '../../pallet.support'
import {AccountId32, AccountVote, Type_49} from './types'

/**
 * An account has voted in a referendum
 */
export type DemocracyVotedEvent = {
    voter: AccountId32,
    refIndex: number,
    vote: AccountVote,
}

export const DemocracyVotedEvent: sts.Type<DemocracyVotedEvent> = sts.struct(() => {
    return  {
        voter: AccountId32,
        refIndex: sts.number(),
        vote: AccountVote,
    }
})

/**
 * An account has secconded a proposal
 */
export type DemocracySecondedEvent = {
    seconder: AccountId32,
    propIndex: number,
}

export const DemocracySecondedEvent: sts.Type<DemocracySecondedEvent> = sts.struct(() => {
    return  {
        seconder: AccountId32,
        propIndex: sts.number(),
    }
})

/**
 * A proposal has been enacted.
 */
export type DemocracyExecutedEvent = {
    refIndex: number,
    result: Type_49,
}

export const DemocracyExecutedEvent: sts.Type<DemocracyExecutedEvent> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
        result: Type_49,
    }
})
