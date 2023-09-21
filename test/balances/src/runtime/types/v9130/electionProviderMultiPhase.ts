import {sts} from '../../pallet.support'
import {ElectionCompute, AccountId32} from './types'

/**
 * The unsigned phase of the given round has started.
 */
export type ElectionProviderMultiPhaseUnsignedPhaseStartedEvent = {
    round: number,
}

export const ElectionProviderMultiPhaseUnsignedPhaseStartedEvent: sts.Type<ElectionProviderMultiPhaseUnsignedPhaseStartedEvent> = sts.struct(() => {
    return  {
        round: sts.number(),
    }
})

/**
 * A solution was stored with the given compute.
 * 
 * If the solution is signed, this means that it hasn't yet been processed. If the
 * solution is unsigned, this means that it has also been processed.
 * 
 * The `bool` is `true` when a previous solution was ejected to make room for this one.
 */
export type ElectionProviderMultiPhaseSolutionStoredEvent = {
    electionCompute: ElectionCompute,
    prevEjected: boolean,
}

export const ElectionProviderMultiPhaseSolutionStoredEvent: sts.Type<ElectionProviderMultiPhaseSolutionStoredEvent> = sts.struct(() => {
    return  {
        electionCompute: ElectionCompute,
        prevEjected: sts.boolean(),
    }
})

/**
 * An account has been slashed for submitting an invalid signed submission.
 */
export type ElectionProviderMultiPhaseSlashedEvent = {
    account: AccountId32,
    value: bigint,
}

export const ElectionProviderMultiPhaseSlashedEvent: sts.Type<ElectionProviderMultiPhaseSlashedEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
        value: sts.bigint(),
    }
})

/**
 * The signed phase of the given round has started.
 */
export type ElectionProviderMultiPhaseSignedPhaseStartedEvent = {
    round: number,
}

export const ElectionProviderMultiPhaseSignedPhaseStartedEvent: sts.Type<ElectionProviderMultiPhaseSignedPhaseStartedEvent> = sts.struct(() => {
    return  {
        round: sts.number(),
    }
})

/**
 * An account has been rewarded for their signed submission being finalized.
 */
export type ElectionProviderMultiPhaseRewardedEvent = {
    account: AccountId32,
    value: bigint,
}

export const ElectionProviderMultiPhaseRewardedEvent: sts.Type<ElectionProviderMultiPhaseRewardedEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
        value: sts.bigint(),
    }
})

/**
 * The election has been finalized, with `Some` of the given computation, or else if the
 * election failed, `None`.
 */
export type ElectionProviderMultiPhaseElectionFinalizedEvent = {
    electionCompute?: (ElectionCompute | undefined),
}

export const ElectionProviderMultiPhaseElectionFinalizedEvent: sts.Type<ElectionProviderMultiPhaseElectionFinalizedEvent> = sts.struct(() => {
    return  {
        electionCompute: sts.option(() => ElectionCompute),
    }
})
