import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * A account index has been frozen to its current account ID.
 */
export type IndicesIndexFrozenEvent = {
    index: number,
    who: AccountId32,
}

export const IndicesIndexFrozenEvent: sts.Type<IndicesIndexFrozenEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        who: AccountId32,
    }
})

/**
 * A account index has been freed up (unassigned).
 */
export type IndicesIndexFreedEvent = {
    index: number,
}

export const IndicesIndexFreedEvent: sts.Type<IndicesIndexFreedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * A account index was assigned.
 */
export type IndicesIndexAssignedEvent = {
    who: AccountId32,
    index: number,
}

export const IndicesIndexAssignedEvent: sts.Type<IndicesIndexAssignedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        index: sts.number(),
    }
})
