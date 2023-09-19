import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const calls = {
    report_dispute_lost_unsigned: createCall(
        'ParasSlashing.report_dispute_lost_unsigned',
        {
            v9420: ParasSlashingReportDisputeLostUnsignedCall,
        }
    ),
}

export const storage = {
    UnappliedSlashes: createStorage(
        'ParasSlashing.UnappliedSlashes',
        {
            v9420: ParasSlashingUnappliedSlashesStorage,
        }
    ),
    ValidatorSetCounts: createStorage(
        'ParasSlashing.ValidatorSetCounts',
        {
            v9420: ParasSlashingValidatorSetCountsStorage,
        }
    ),
}

export default {calls}
