import {Bytes} from '@subsquid/substrate-runtime'
import {IAccessListItem, IU256} from './tx-types'


export function normalizeU256(value: IU256): bigint {
    if (Array.isArray(value)) {
        return toU256(toU128(value[0], value[1]), toU128(value[2], value[3]))
    } else {
        return value
    }
}


function toU128(a: bigint, b: bigint) {
    return a + (b << 64n)
}


function toU256(a: bigint, b: bigint) {
    return a + (b << 128n)
}


export function normalizeAccessList(items: IAccessListItem[]): {
    address: Bytes,
    storageKeys: Bytes[]
}[] {
    return items.map(it => {
        if (it.slots == null) return it
        return {
            address: it.address,
            storageKeys: it.slots
        }
    })
}
