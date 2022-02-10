import {Metadata} from "@subsquid/substrate-metadata"
import {toHex} from "@subsquid/util"
import blake2b from "blake2b"
import {Extrinsic} from "./model"


// 0x789f1c09383940a7773420432ffd084a7767e29082d7fa0e8d744e796f6c3399
// export const EVENT_STORAGE_KEY = '0x' + Buffer.from([
//     ...blake2bHash("System", 16),
//     ...blake2bHash("Events", 16)
// ]).toString("hex")
export const EVENT_STORAGE_KEY = "0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7"


export function blake2bHash(bytes: Uint8Array | string, len: number): Uint8Array {
    if (typeof bytes == 'string') {
        bytes = Buffer.from(bytes)
    }
    let hash = blake2b(len)
    hash.update(bytes)
    return hash.digest()
}


/**
 * Formats the event id into a fixed-lentgth string. When formatted the natural string ordering
 * is the same as the ordering
 * in the blockchain (first ordered by block height, then by block ID)
 *
 * @return  id in the format 000000..00<blockNum>-000<index>-<shorthash>
 *
 */
export function formatId(height: number, hash: string, index?: number): string {
    const blockPart = `${String(height).padStart(10, "0")}`
    const indexPart =
        index !== undefined
            ? `-${String(index).padStart(6, "0")}`
            : ""
    const _hash = hash.startsWith("0x") ? hash.substring(2) : hash
    const shortHash =
        _hash.length < 5
            ? _hash.padEnd(5, "0")
            : _hash.slice(0, 5)
    return `${blockPart}${indexPart}-${shortHash}`
}


export function omit(obj: any, ...keys: string[]): any {
    let copy = {...obj}
    keys.forEach(key => {
        delete copy[key]
    })
    return copy
}


export function isPreV14(metadata: Metadata): boolean {
    switch(metadata.__kind) {
        case 'V0':
        case 'V1':
        case 'V2':
        case 'V3':
        case 'V4':
        case 'V5':
        case 'V6':
        case 'V7':
        case 'V8':
        case 'V9':
        case 'V10':
        case 'V11':
        case 'V12':
        case 'V13':
            return true
        default:
            return false
    }
}


export function toJsonString(obj: unknown): string {
    return JSON.stringify(obj, jsonReplacer)
}


function jsonReplacer(key: string, value: unknown): any {
    switch(typeof value) {
        case 'bigint':
            return value.toString()
        case 'object':
            if (value instanceof Uint8Array) {
                return toHex(value)
            } else {
                return value
            }
        default:
            return value
    }
}


/**
 * All blocks have timestamp event except for the genesic block.
 * This method looks up `timestamp.set` and reads off the block timestamp
 *
 * @param extrinsics block extrinsics
 * @returns timestamp as set by a `timestamp.set` call
 */
export function getBlockTimestamp(extrinsics: (Extrinsic & {args: any})[]): Date {  // TODO: change args to unknown
    let extrinsic = extrinsics.find(extrinsic => {
        return extrinsic.name == 'timestamp.set'
    })
    return new Date(extrinsic ? extrinsic.args.now : 0)
}
