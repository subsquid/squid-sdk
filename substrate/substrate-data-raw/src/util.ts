import {last, maybeLast} from '@subsquid/util-internal'
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


export interface PrevItem<T> {
    height: number
    value: T
}


export class Prev<T> {
    private items: PrevItem<T>[] = []

    constructor(private maxSize = 2) {
        assert(maxSize >= 1)
    }

    get(height: number): T | undefined {
        return this.getItem(height)?.value
    }

    getItem(height: number): PrevItem<T> | undefined {
        this.rollbackTo(height - 1)
        return maybeLast(this.items)
    }

    set(height: number, value: T): void {
        this.rollbackTo(height - 1)
        this.items.push({height, value})
        if (this.items.length > this.maxSize) {
            this.items.shift()
        }
    }

    private rollbackTo(height: number): void {
        while (this.items.length && last(this.items).height > height) {
            this.items.pop()
        }
    }
}
