import {BlockHeader} from './types'


export function isChain(a: BlockHeader, b: BlockHeader): boolean {
    return a.slot == b.parentSlot && a.hash == b.parentHash
}
