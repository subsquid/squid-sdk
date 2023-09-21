import {sts} from '../../pallet.support'
import {ElectionCompute, AccountId32, Phase} from './types'

/**
 * A solution was stored with the given compute.
 * 
 * The `origin` indicates the origin of the solution. If `origin` is `Some(AccountId)`,
 * the stored solution was submited in the signed phase by a miner with the `AccountId`.
 * Otherwise, the solution was stored either during the unsigned phase or by
 * `T::ForceOrigin`. The `bool` is `true` when a previous solution was ejected to make
 * room for this one.
 */
export type ElectionProviderMultiPhaseSolutionStoredEvent = {
    compute: ElectionCompute,
    origin?: (AccountId32 | undefined),
    prevEjected: boolean,
}

export const ElectionProviderMultiPhaseSolutionStoredEvent: sts.Type<ElectionProviderMultiPhaseSolutionStoredEvent> = sts.struct(() => {
    return  {
        compute: ElectionCompute,
        origin: sts.option(() => AccountId32),
        prevEjected: sts.boolean(),
    }
})

/**
 * There was a phase transition in a given round.
 */
export type ElectionProviderMultiPhasePhaseTransitionedEvent = {
    from: Phase,
    to: Phase,
    round: number,
}

export const ElectionProviderMultiPhasePhaseTransitionedEvent: sts.Type<ElectionProviderMultiPhasePhaseTransitionedEvent> = sts.struct(() => {
    return  {
        from: Phase,
        to: Phase,
        round: sts.number(),
    }
})
