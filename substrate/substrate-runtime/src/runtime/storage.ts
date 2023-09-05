import {HexSink, Codec, Src} from '@subsquid/scale-codec'
import {unexpectedCase} from '@subsquid/util-internal'
import {toHex} from '@subsquid/util-internal-hex'
import {xxhash128, xxhash256, xxhash64} from '@subsquid/util-xxhash'
import assert from 'assert'
import blake2b from 'blake2b'
import {Bytes, StorageHasher, StorageItem} from '../metadata'


const NAME_HASHES: Record<string, string> = {}


export function getNameHash(name: string): Bytes {
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


export function encodeName(prefix: string, name: string): Bytes {
    return getNameHash(prefix) + getNameHash(name).slice(2)
}


export function encodeKey(codec: Codec, prefix: string, name: string, item: StorageItem, key: any[]): Bytes {
    assert(key.length <= item.hashers.length)
    let encoding = getNameHash(prefix) + getNameHash(name).slice(2)
    for (let i = 0; i < key.length; i++) {
        encoding += getKeyHash(
            item.hashers[i],
            codec.encodeToBinary(item.keys[i], key[i])
        ).slice(2)
    }
    return encoding
}


export function decodeKey(codec: Codec, item: StorageItem, key: Bytes | Uint8Array): any {
    let res: any[] = []
    let src = new Src(key)
    src.skip(32)
    for (let i = 0; i < item.keys.length; i++) {
        switch(item.hashers[i]) {
            case 'Identity':
                break
            case 'Blake2_128Concat':
                src.skip(16)
                break
            case 'Twox64Concat':
                src.skip(8)
                break
            case 'Blake2_128':
            case 'Twox128':
            case 'Blake2_256':
            case 'Twox256':
                throw new Error(`Original value of storage item key can't be restored from ${item.hashers[i]} encoding`)
            default:
                throw unexpectedCase(item.hashers[i])
        }
        res.push(codec.decode(item.keys[i], src))
    }
    src.assertEOF()
    return res
}


export function decodeValue(codec: Codec, item: StorageItem, value?: Bytes | Uint8Array | null): any {
    if (value == null) {
        switch(item.modifier) {
            case 'Optional':
                return undefined
            case 'Default':
                value = item.fallback
                break
            case 'Required':
                throw new Error(`Required storage item not found`)
            default:
                throw unexpectedCase(item.modifier)
        }
    }
    return codec.decodeBinary(item.value, value)
}
