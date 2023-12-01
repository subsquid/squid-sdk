import assert from 'assert'
import {Bytes32, Qty} from '../interfaces/base'


export function qty2Int(qty: Qty): number {
    let i = parseInt(qty, 16)
    assert(Number.isSafeInteger(i))
    return i
}


export function toQty(i: number): Qty {
    return '0x' + i.toString(16)
}


export function getTxHash(tx: Bytes32 | {hash: Bytes32}): Bytes32 {
    if (typeof tx == 'string') {
        return tx
    } else {
        return tx.hash
    }
}
