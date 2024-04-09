import {Base58Bytes} from '@subsquid/solana-rpc-data'
import {toHex} from '@subsquid/util-internal-hex'
import bs58 from 'bs58'


export const D8 = Symbol('D8')


export function getDescriptor(i: {data: Base58Bytes, [D8]?: string}): string {
    if (i[D8]) return i[D8]
    let bytes = toHex(bs58.decode(i.data))
    return i[D8] = bytes.slice(0, 18)
}
