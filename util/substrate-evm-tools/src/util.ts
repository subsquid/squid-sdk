import assert from 'assert'

export function normalizeU256(value: bigint | bigint[]): bigint {
    if (Array.isArray(value)) {
        assert(value.length === 4)
        return toU256(toU128(value[0], value[1]), toU128(value[2], value[3]))
    } else {
        return BigInt(value)
    }
}

function toU128(a: bigint, b: bigint) {
    return BigInt(a) + (BigInt(b) << 64n)
}

function toU256(a: bigint, b: bigint) {
    return BigInt(a) + (BigInt(b) << 128n)
}

export function clearUndefinedFields<T extends Record<string, any>>(obj: T): T {
    Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key])
    return obj
}
