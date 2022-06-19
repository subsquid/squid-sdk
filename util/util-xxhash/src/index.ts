import {XXHash128, XXHash256} from "./composite"
import {XXHash} from "./interface"
import {XXHashJs64} from "./js"
import * as wasm from "./wasm"


export {XXHash}


export function xxhash64(): XXHash {
    let h64 = wasm.isReady() ? wasm.h64 : () => new XXHashJs64()
    return h64()
}


export function xxhash128(): XXHash {
    let h64 = wasm.isReady() ? wasm.h64 : (seed: number) => new XXHashJs64(seed)
    return new XXHash128(h64)
}


export function xxhash256(): XXHash {
    let h64 = wasm.isReady() ? wasm.h64 : (seed: number) => new XXHashJs64(seed)
    return new XXHash256(h64)
}
