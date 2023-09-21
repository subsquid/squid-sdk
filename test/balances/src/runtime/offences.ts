import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9130 from './types/v9130'
import * as v9010 from './types/v9010'
import * as v1058 from './types/v1058'
import * as v1020 from './types/v1020'

export const events = {
    Offence: createEvent(
        'Offences.Offence',
        {
            v1020: v1020.OffencesOffenceEvent,
            v1058: v1058.OffencesOffenceEvent,
            v9010: v9010.OffencesOffenceEvent,
            v9130: v9130.OffencesOffenceEvent,
        }
    ),
}

export const storage = {
    ConcurrentReportsIndex: createStorage(
        'Offences.ConcurrentReportsIndex',
        {
            v1020: v1020.OffencesConcurrentReportsIndexStorage,
        }
    ),
    DeferredOffences: createStorage(
        'Offences.DeferredOffences',
        {
            v1058: v1058.OffencesDeferredOffencesStorage,
        }
    ),
    Reports: createStorage(
        'Offences.Reports',
        {
            v1020: v1020.OffencesReportsStorage,
        }
    ),
    ReportsByKindIndex: createStorage(
        'Offences.ReportsByKindIndex',
        {
            v1020: v1020.OffencesReportsByKindIndexStorage,
        }
    ),
}

export default {events}
