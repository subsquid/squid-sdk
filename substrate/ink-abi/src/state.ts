import {HexSink, Src} from "@subsquid/scale-codec"
import {decodeHex} from "@subsquid/util-internal-hex"


export function encodeCall(address: string, input: Uint8Array) {
    let sink = new HexSink()
    let dest = decodeHex(address)
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


export function decodeResult(result: string) {
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
