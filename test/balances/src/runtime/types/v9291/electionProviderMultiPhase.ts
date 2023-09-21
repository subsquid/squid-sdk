import {sts} from '../../pallet.support'
import {ElectionCompute, ElectionScore} from './types'

/**
 * A solution was stored with the given compute.
 * 
 * If the solution is signed, this means that it hasn't yet been processed. If the
 * solution is unsigned, this means that it has also been processed.
 * 
 * The `bool` is `true` when a previous solution was ejected to make room for this one.
 */
export type ElectionProviderMultiPhaseSolutionStoredEvent = {
    compute: ElectionCompute,
    prevEjected: boolean,
}

export const ElectionProviderMultiPhaseSolutionStoredEvent: sts.Type<ElectionProviderMultiPhaseSolutionStoredEvent> = sts.struct(() => {
    return  {
        compute: ElectionCompute,
        prevEjected: sts.boolean(),
    }
})

/**
 * The election has been finalized, with the given computation and score.
 */
export type ElectionProviderMultiPhaseElectionFinalizedEvent = {
    compute: ElectionCompute,
    score: ElectionScore,
}

export const ElectionProviderMultiPhaseElectionFinalizedEvent: sts.Type<ElectionProviderMultiPhaseElectionFinalizedEvent> = sts.struct(() => {
    return  {
        compute: ElectionCompute,
        score: ElectionScore,
    }
})

/**
 * An election failed.
 * 
 * Not much can be said about which computes failed in the process.
 */
export type ElectionProviderMultiPhaseElectionFailedEvent = null

export const ElectionProviderMultiPhaseElectionFailedEvent: sts.Type<ElectionProviderMultiPhaseElectionFailedEvent> = sts.unit()
