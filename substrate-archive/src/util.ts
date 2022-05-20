import {JsonCodec} from "@subsquid/scale-codec"
import blake2b from "blake2b"


export const EVENT_STORAGE_KEY = "0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7"
export const NEXT_FEE_MULTIPLIER_STORAGE_KEY = "0x3f1467a096bcd71a5b6a0c8155e208103f2edf3bdf381debe331ab7446addfdc"
export const VALIDATORS_STORAGE_KEY = "0xcec5070d609dd3497f72bde07fc96ba088dcde934c658227ee1dfafcd6e16903"
export const SESSION_STORAGE_KEY = "0xcec5070d609dd3497f72bde07fc96ba072763800a36a99fdfc7c10f6415f6ee6"


export function blake2bHash(bytes: Uint8Array | string, len: number): Uint8Array {
    if (typeof bytes == 'string') {
        bytes = Buffer.from(bytes)
    }
    let hash = blake2b(len)
    hash.update(bytes)
    return hash.digest()
}


export function toJsonString(val: unknown): string {
    return JSON.stringify(toJSON(val))
}


export function toJSON(val: unknown): any {
    return JsonCodec.encode(val)
}


export function splitSpecId(specId: string): [name: string, version: number] {
    let m = /^(.*)@(\d+)$/.exec(specId)
    if (m == null) throw new Error(`Invalid spec id: ${specId}`)
    return [
        m[1],
        parseInt(m[2])
    ]
}
