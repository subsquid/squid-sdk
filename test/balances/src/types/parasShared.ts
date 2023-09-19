import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const storage = {
    ActiveValidatorIndices: createStorage(
        'ParasShared.ActiveValidatorIndices',
        {
            v9010: ParasSharedActiveValidatorIndicesStorage,
        }
    ),
    ActiveValidatorKeys: createStorage(
        'ParasShared.ActiveValidatorKeys',
        {
            v9010: ParasSharedActiveValidatorKeysStorage,
        }
    ),
    CurrentSessionIndex: createStorage(
        'ParasShared.CurrentSessionIndex',
        {
            v9010: ParasSharedCurrentSessionIndexStorage,
        }
    ),
}

export default {}
