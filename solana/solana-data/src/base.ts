import assert from 'assert'


export type Base58Bytes = string
export type Commitment = 'finalized' | 'confirmed' | 'processed'


export interface BlockId {
    blockHash: Base58Bytes
    slot: number
}


/**
 * `{blockHash}__{slot}`
 */
export type SolanaHash = string


export function parseSolanaHash(hash: SolanaHash): BlockId {
    let parts = hash.split('__')
    assert(parts.length == 2)
    let slot = parseInt(parts[1])
    assert(Number.isSafeInteger(slot))
    return {
        blockHash: parts[0],
        slot
    }
}
