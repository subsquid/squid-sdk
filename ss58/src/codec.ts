import {decode, encode} from "@subsquid/ss58-codec"
import assert from "assert"


export class Codec {
    constructor(public readonly prefix: number) {
        assert(Number.isInteger(prefix) && prefix >= 0 && prefix < 16384, 'invalid prefix')
    }

    encode(bytes: Uint8Array): string {
        return encode({prefix: this.prefix, bytes})
    }

    decode(s: string): Uint8Array {
        let a = decode(s)
        if (a.prefix != this.prefix) {
            throw new Error(`Expected an address with prefix ${this.prefix}, but ${s} has prefix ${a.prefix}`)
        }
        return a.bytes
    }
}
