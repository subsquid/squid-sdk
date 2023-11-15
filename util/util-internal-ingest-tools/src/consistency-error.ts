import {BlockRef, getBlockName} from './ref'


export class DataConsistencyError extends Error {
    get __sqd_data_consistency_error(): boolean {
        return true
    }
}


export class BlockConsistencyError extends DataConsistencyError {
    constructor(ref: BlockRef) {
        super(`Failed to fetch block ${getBlockName(ref)}, perhaps chain node navigated to another branch.`)
    }
}


export function isDataConsistencyError(err: unknown): err is Error {
    return err instanceof Error && !!(err as any).__sqd_data_consistency_error
}
