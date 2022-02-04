import assert from "assert"
import basex from "base-x"
import blake2b from "blake2b"
const base58 = basex('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz')
const HASH_PREFIX = Buffer.from('SS58PRE')
const HASH_BUF = Buffer.alloc(64)

/**
 * Decoded SS58 address
 */
export interface Address {
    /**
     * Address [type](https://docs.substrate.io/v3/advanced/ss58/#address-type)
     */
    prefix: number
    /**
     * Raw address bytes
     */
    bytes: Uint8Array
}


/**
 * Decode SS58 address string.
 *
 * This function follows [Ss58Codec trait](https://github.com/paritytech/substrate/blob/ded44948e2d5a398abcb4e342b0513cb690961bb/primitives/core/src/crypto.rs#L245)
 */
export function decode(s: string): Address {
    let buf = base58.decodeUnsafe(s)
    if (buf == null || buf.length < 3) throw invalidAddress(s)
    let b0 = buf[0]
    let offset
    let prefix
    if (b0 < 64) {
        prefix = b0
        offset = 1
    } else if (b0 < 128) {
        let b1 = buf[1]
        let lower = ((b0 << 2) | (b1 >> 6)) & 0b11111111
        let upper = b1 & 0b00111111
        prefix = lower | (upper << 8)
        offset = 2
    } else {
        throw invalidAddress(s)
    }
    let hashLen: number
    switch(buf.length - offset) {
        case 34:
        case 35:
            hashLen = 2
            break
        case 9:
        case 5:
        case 3:
        case 2:
            hashLen = 1
            break
        default:
            throw invalidAddress(s)
    }
    computeHash(buf, hashLen)
    for (let i = 0; i < hashLen; i++) {
        if (HASH_BUF[i] != buf[buf.length - hashLen + i]) {
            throw invalidAddress(s)
        }
    }
    return {
        prefix,
        bytes: buf.subarray(offset, buf.length - hashLen)
    }
}


/**
 * Encode SS58 address into canonical string format
 */
export function encode(address: Address): string {
    let prefix = address.prefix
    assert(Number.isInteger(prefix) && prefix >= 0 && prefix < 16384, 'invalid prefix')
    let len = address.bytes.length
    let hashLen: number
    switch(len) {
        case 1:
        case 2:
        case 4:
        case 8:
            hashLen = 1
            break
        case 32:
        case 33:
            hashLen = 2
            break
        default:
            assert(false, 'invalid address length')
    }
    let buf
    let offset
    if (prefix < 64) {
        buf = Buffer.allocUnsafe(1 + hashLen + len)
        buf[0] = prefix
        offset = 1
    } else {
        buf = Buffer.allocUnsafe(2 + hashLen + len)
        buf[0] = ((prefix & 0b1111_1100) >> 2) | 0b01000000
        buf[1] = (prefix >> 8) | ((prefix & 0b11) << 6)
        offset = 2
    }
    buf.set(address.bytes, offset)
    computeHash(buf, hashLen)
    for (let i = 0; i < hashLen; i++) {
        buf[offset + len + i] = HASH_BUF[i]
    }
    return base58.encode(buf)
}


function computeHash(buf: Uint8Array, len: number): void {
    let hash = blake2b(64)
    hash.update(HASH_PREFIX)
    hash.update(buf.subarray(0, buf.length - len))
    hash.digest(HASH_BUF)
}


function invalidAddress(s: string): Error {
    return new Error('Invalid ss58 address: ' + s)
}
