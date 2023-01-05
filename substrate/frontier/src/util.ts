import assert from 'assert'

export function normalizeU256(value: string | string[]): bigint {
    if (Array.isArray(value)) {
        assert(value.length === 4)
        return toU256(toU128(BigInt(value[0]), BigInt(value[1])), toU128(BigInt(value[2]), BigInt(value[3])))
    } else {
        return BigInt(value)
    }
}

function toU128(a: bigint, b: bigint) {
    return a + (b << 64n)
}

function toU256(a: bigint, b: bigint) {
    return a + (b << 128n)
}

export function normalizeAccessListItem(
    item: {address: string; storageKeys: string[]} | {address: string; slots: string[]}
) {
    return 'storageKeys' in item ? item : {address: item.address, storageKeys: item.slots}
}

export function clearUndefinedFields<T extends Record<string, any>>(obj: T): T {
    Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key])
    return obj
}
