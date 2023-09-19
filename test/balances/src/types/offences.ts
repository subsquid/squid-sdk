import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Offence: createEvent(
        'Offences.Offence',
        {
            v1020: OffencesOffenceEvent,
            v1058: OffencesOffenceEvent,
            v9010: OffencesOffenceEvent,
            v9130: OffencesOffenceEvent,
        }
    ),
}

export const storage = {
    ConcurrentReportsIndex: createStorage(
        'Offences.ConcurrentReportsIndex',
        {
            v1020: OffencesConcurrentReportsIndexStorage,
        }
    ),
    DeferredOffences: createStorage(
        'Offences.DeferredOffences',
        {
            v1058: OffencesDeferredOffencesStorage,
        }
    ),
    Reports: createStorage(
        'Offences.Reports',
        {
            v1020: OffencesReportsStorage,
        }
    ),
    ReportsByKindIndex: createStorage(
        'Offences.ReportsByKindIndex',
        {
            v1020: OffencesReportsByKindIndexStorage,
        }
    ),
}

export default {events}
