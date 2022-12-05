import {sr25519Sign} from '@polkadot/wasm-crypto'
import {decodeHex} from '@subsquid/util-internal-hex'


export class KeyPair {
    private pubKey: Uint8Array
    private privateKey: () => Uint8Array

    constructor(pubKey: string | Uint8Array, privateKey: string | Uint8Array) {
        this.pubKey = typeof pubKey == 'string' ? decodeHex(pubKey) : pubKey
        let secret = typeof privateKey == 'string' ? decodeHex(privateKey) : privateKey
        this.privateKey = () => secret // Does this help to prevent some kind of leaks?
    }

    getPublicKey(): Uint8Array {
        return this.pubKey
    }

    sign(bytes: Uint8Array): Uint8Array {
        return sr25519Sign(this.pubKey, this.privateKey(), bytes)
    }

    get signatureType(): number {
        return 1
    }
}
