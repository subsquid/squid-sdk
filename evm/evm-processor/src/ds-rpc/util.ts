import assert from 'assert'
import {Bytes32, Qty} from '../interfaces/base'
import * as rpc from './rpc-data'


export function qty2Int(qty: Qty): number {
    let i = parseInt(qty, 16)
    assert(Number.isSafeInteger(i))
    return i
}


export function toQty(i: number): Qty {
    return '0x' + i.toString(16)
}


export function getBlockName(block: rpc.Block | {height: number, hash?: string, number?: undefined}): string {
    let height: number
    let hash: string | undefined
    if (block.number == null) {
        height = block.height
        hash = block.hash
    } else {
        height = qty2Int(block.number)
        hash = block.hash
    }
    if (hash) {
        return `${height}#${hash.slice(2, 8)}`
    } else {
        return '' + height
    }
}


export function getBlockHeight(block: rpc.Block): number {
    return qty2Int(block.number)
}


export function getTxHash(tx: Bytes32 | rpc.Transaction): Bytes32 {
    if (typeof tx == 'string') {
        return tx
    } else {
        return tx.hash
    }
}
