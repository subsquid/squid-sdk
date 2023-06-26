import assert from 'assert'
import {Qty, RuntimeVersionId} from './interfaces'


export function qty2Int(qty: Qty): number {
    let i = parseInt(qty, 16)
    assert(Number.isSafeInteger(i))
    return i
}


export function toQty(n: number): Qty {
    return '0x' + n.toString(16)
}


export function runtimeVersionEquals(a: RuntimeVersionId, b: RuntimeVersionId): boolean {
    return a.specName == b.specName
        && a.specVersion == b.specVersion
        && a.implName == b.implName
        && a.implVersion == b.implVersion
}
