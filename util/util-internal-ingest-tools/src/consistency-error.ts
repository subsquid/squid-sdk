import {BlockRef, getBlockName} from './ref'


export class ConsistencyError extends Error {}


export class BlockConsistencyError extends ConsistencyError {
    constructor(ref: BlockRef) {
        super(`Failed to fetch block ${getBlockName(ref)}, perhaps chain node navigated to another branch.`)
    }
}
