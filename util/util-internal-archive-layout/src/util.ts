import {isHex} from '@subsquid/util-internal-hex'
import assert from 'assert'


export function getShortHash(hash: string): string {
    assert(isHex(hash))
    return hash.slice(2, 8)
}


export function formatBlockNumber(height: number): string {
    return String(height).padStart(10, '0')
}
