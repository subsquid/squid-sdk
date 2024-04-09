import {BlockConsistencyError} from './consistency-error'
import {BlockRef} from './ref'


export interface IsInvalid {
    _isInvalid?: boolean
    _errorMessage?: string
}


export function setInvalid(blocks: IsInvalid[], index?: number): void {
    blocks[index || 0]._isInvalid = true
}


export function assertIsValid(blocks: (IsInvalid & BlockRef)[]): void {
    for (let block of blocks) {
        if (block._isInvalid) throw new BlockConsistencyError(block, block._errorMessage)
    }
}


export function trimInvalid<B extends IsInvalid>(blocks: B[]): B[] {
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i]._isInvalid) return blocks.slice(0, i)
    }
    return blocks
}
