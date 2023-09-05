import * as ss58codec from '@subsquid/ss58-codec'
import {decodeHex, toHex} from '@subsquid/util-internal-hex'

/**
 * Hex encoded byte string
 */
export type Bytes = string


export interface Address {
    prefix: number
    bytes: Bytes
}


interface AddressToEncode {
    prefix: number
    bytes: Bytes | Uint8Array
}


export function encode(address: AddressToEncode): Bytes {
    let {prefix, bytes} = address
    if (typeof bytes == 'string') {
        bytes = decodeHex(bytes)
    }
    return ss58codec.encode({prefix, bytes})
}


export function decode(s: string): Address {
    let {prefix, bytes} = ss58codec.decode(s)
    return {
        prefix,
        bytes: toHex(bytes)
    }
}
