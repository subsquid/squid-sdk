import {BlockHeader} from './types'


export function isChain(a: BlockHeader, b: BlockHeader): boolean {
    return a.number == b.parentNumber && a.hash == b.parentHash
}
