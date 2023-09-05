import {HexSink, Src} from '@subsquid/scale-codec'
import {decodeHex} from '@subsquid/util-internal-hex'
import {Bytes} from './abi-description'


export function encodeCall(address: Uint8Array | Bytes, input: Uint8Array): Bytes {
    let sink = new HexSink()
    let dest = typeof address == 'string' ? decodeHex(address) : address
    sink.bytes(dest) // origin
    sink.bytes(dest) // dest
    sink.u128(0n) // balance
    sink.u8(0) // optional gasLimit
    sink.u8(0) // optional storageDepositLimit
    // msg selector + arguments
    sink.compact(input.length)
    sink.bytes(input)
    return sink.toHex()
}


export function decodeResult(result: Uint8Array | Bytes): Uint8Array {
    let src = new Src(result);
    // gasConsumed
    src.compact()
    src.compact()
    // gasRequired
    src.compact()
    src.compact()
    // storageDeposit
    src.u8()
    src.u128()
    src.str() // debugMessage
    src.u8() // result
    src.u32() // flags
    return src.bytes(src.compactLength()) // execResult
}
