import {Codec, Sink, Src} from '@subsquid/borsh'
import {Base58Bytes} from '@subsquid/borsh/lib/type-util'
import {readLines} from '@subsquid/util-internal-read-lines'
import base58 from 'bs58'


export interface CallData {
    tx: Base58Bytes
    data: Base58Bytes
}


export function readCallData(file: string): CallData[] {
    let result: CallData[] = []
    let first = true
    for (let line of readLines(file)) {
        if (first) {
            first = false
        } else if (line) {
            let [tx, data] = line.split(',')
            result.push({
                tx,
                data
            })
        }
    }
    return result
}


export function buildCallArray(data: CallData[]): Uint8Array {
    let sink = new Sink()
    sink.u32(data.length)
    for (let call of data) {
        let bytes = base58.decode(call.data).subarray(8)
        sink.bytes(bytes)
    }
    return sink.result()
}


export function measure<T>(name: string, cb: () => T): T {
    let beg = Date.now()
    let result = cb()
    let end = Date.now()
    console.log(`${name}: ${end - beg} ms`)
    return result
}


export function kb(bytes: Uint8Array): string {
    return Math.round(bytes.length / 1024) + ' kb'
}


export function decode<T>(codec: Codec<T>, input: Uint8Array): T {
    return codec.decode(new Src(input))
}
