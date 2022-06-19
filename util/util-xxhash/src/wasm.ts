import assert from "assert"
import xxhashWasm, {XXHashAPI} from "xxhash-wasm"
import {XXHash} from "./interface"


let api: XXHashAPI | undefined


xxhashWasm().then(
    _api => {
        api = _api
    },
    err => {
        // ignore
    }
)


export function isReady(): boolean {
    return api != null
}


export function h64(seed?: bigint | number): XXHash {
    assert(api != null, 'wasm implementation is not available')
    return api.create64(BigInt(seed || 0))
}
