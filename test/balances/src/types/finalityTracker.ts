import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const calls = {
    final_hint: createCall(
        'FinalityTracker.final_hint',
        {
            v1020: FinalityTrackerFinalHintCall,
        }
    ),
}

export const constants = {
    ReportLatency: createConstant(
        'FinalityTracker.ReportLatency',
        {
            v1020: FinalityTrackerReportLatencyConstant,
        }
    ),
    WindowSize: createConstant(
        'FinalityTracker.WindowSize',
        {
            v1020: FinalityTrackerWindowSizeConstant,
        }
    ),
}

export const storage = {
    Initialized: createStorage(
        'FinalityTracker.Initialized',
        {
            v1052: FinalityTrackerInitializedStorage,
        }
    ),
    Median: createStorage(
        'FinalityTracker.Median',
        {
            v1052: FinalityTrackerMedianStorage,
        }
    ),
    OrderedHints: createStorage(
        'FinalityTracker.OrderedHints',
        {
            v1052: FinalityTrackerOrderedHintsStorage,
        }
    ),
    RecentHints: createStorage(
        'FinalityTracker.RecentHints',
        {
            v1052: FinalityTrackerRecentHintsStorage,
        }
    ),
    Update: createStorage(
        'FinalityTracker.Update',
        {
            v1052: FinalityTrackerUpdateStorage,
        }
    ),
}

export default {calls, constants}
