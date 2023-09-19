import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    CandidateBacked: createEvent(
        'ParaInclusion.CandidateBacked',
        {
            v9090: ParaInclusionCandidateBackedEvent,
            v9111: ParaInclusionCandidateBackedEvent,
        }
    ),
    CandidateIncluded: createEvent(
        'ParaInclusion.CandidateIncluded',
        {
            v9090: ParaInclusionCandidateIncludedEvent,
            v9111: ParaInclusionCandidateIncludedEvent,
        }
    ),
    CandidateTimedOut: createEvent(
        'ParaInclusion.CandidateTimedOut',
        {
            v9090: ParaInclusionCandidateTimedOutEvent,
            v9111: ParaInclusionCandidateTimedOutEvent,
        }
    ),
    UpwardMessagesReceived: createEvent(
        'ParaInclusion.UpwardMessagesReceived',
        {
            v9430: ParaInclusionUpwardMessagesReceivedEvent,
        }
    ),
}

export const storage = {
    AvailabilityBitfields: createStorage(
        'ParaInclusion.AvailabilityBitfields',
        {
            v9090: ParaInclusionAvailabilityBitfieldsStorage,
            v9111: ParaInclusionAvailabilityBitfieldsStorage,
        }
    ),
    PendingAvailability: createStorage(
        'ParaInclusion.PendingAvailability',
        {
            v9090: ParaInclusionPendingAvailabilityStorage,
            v9111: ParaInclusionPendingAvailabilityStorage,
        }
    ),
    PendingAvailabilityCommitments: createStorage(
        'ParaInclusion.PendingAvailabilityCommitments',
        {
            v9090: ParaInclusionPendingAvailabilityCommitmentsStorage,
        }
    ),
}

export default {events}
