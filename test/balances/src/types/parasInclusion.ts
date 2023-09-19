import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    CandidateBacked: createEvent(
        'ParasInclusion.CandidateBacked',
        {
            v9010: ParasInclusionCandidateBackedEvent,
        }
    ),
    CandidateIncluded: createEvent(
        'ParasInclusion.CandidateIncluded',
        {
            v9010: ParasInclusionCandidateIncludedEvent,
        }
    ),
    CandidateTimedOut: createEvent(
        'ParasInclusion.CandidateTimedOut',
        {
            v9010: ParasInclusionCandidateTimedOutEvent,
        }
    ),
}

export const storage = {
    AvailabilityBitfields: createStorage(
        'ParasInclusion.AvailabilityBitfields',
        {
            v9010: ParasInclusionAvailabilityBitfieldsStorage,
        }
    ),
    PendingAvailability: createStorage(
        'ParasInclusion.PendingAvailability',
        {
            v9010: ParasInclusionPendingAvailabilityStorage,
        }
    ),
    PendingAvailabilityCommitments: createStorage(
        'ParasInclusion.PendingAvailabilityCommitments',
        {
            v9010: ParasInclusionPendingAvailabilityCommitmentsStorage,
        }
    ),
}

export default {events}
