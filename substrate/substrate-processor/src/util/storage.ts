import {HexSink, Src} from "@subsquid/scale-codec"
import {StorageHasher} from "@subsquid/substrate-metadata"
import {unexpectedCase} from "@subsquid/util-internal"
import {toHex} from "@subsquid/util-internal-hex"
import {xxhash128, xxhash256, xxhash64} from "@subsquid/util-xxhash"
import blake2b from "blake2b"


const NAME_HASHES: Record<string, string> = {}


export function getNameHash(name: string): string {
    let hash = NAME_HASHES[name]
    if (hash == null) {
        let digest = xxhash128().update(name).digest()
        let sink = new HexSink()
        sink.u128(digest)
        hash = NAME_HASHES[name] = sink.toHex()
    }
    return hash
}


export function getKeyHash(hasher: StorageHasher, key: Uint8Array): string {
    switch(hasher) {
        case 'Identity':
            return toHex(key)
        case 'Blake2_128':
            return toHex(blake2b(16).update(key).digest())
        case 'Blake2_256':
            return toHex(blake2b(32).update(key).digest())
        case 'Blake2_128Concat': {
            let digest = blake2b(16).update(key).digest()
            return toHex(digest) + toHex(key).slice(2)
        }
        case 'Twox64Concat': {
            let digest = xxhash64().update(key).digest()
            let sink = new HexSink()
            sink.u64(digest)
            sink.bytes(key)
            return sink.toHex()
        }
        case 'Twox128': {
            let digest = xxhash128().update(key).digest()
            let sink = new HexSink()
            sink.u128(digest)
            return sink.toHex()
        }
        case 'Twox256': {
            let digest = xxhash256().update(key).digest()
            let sink = new HexSink()
            sink.u256(digest)
            return sink.toHex()
        }
        default:
            throw unexpectedCase(hasher)
    }
}
