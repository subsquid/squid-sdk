import {BlockRef, getBlockName} from './ref'


export class DataConsistencyError extends Error {
    get __sqd_data_consistency_error(): boolean {
        return true
    }
}


export class BlockConsistencyError extends DataConsistencyError {
    constructor(ref: BlockRef, errorMsg?: string) {
        let msg = `Failed to fetch block ${getBlockName(ref)}`
        if (errorMsg) {
            msg += ': ' + errorMsg
        }
        super(msg)
    }
}


export function isDataConsistencyError(err: unknown): err is Error {
    return err instanceof Error && !!(err as any).__sqd_data_consistency_error
}
