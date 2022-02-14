import {Metadata} from "@subsquid/substrate-metadata"
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {assertNotNull, toCamelCase} from "@subsquid/util"
import blake2b from "blake2b"
import {sub} from "../interfaces"
import {Extrinsic} from "../model"


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
 * Formats the event id into a fixed-length string. When formatted the natural string ordering
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


export function omitKind<T extends {__kind: string}>(obj: T): Omit<T, '__kind'> {
    let {__kind, ...props} = obj
    return props
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


/**
 * All blocks have timestamp event except for the genesic block.
 * This method looks up `timestamp.set` and reads off the block timestamp
 */
export function getBlockTimestamp(extrinsics: (Extrinsic & {args: any})[]): number {
    for (let i = 0; i < extrinsics.length; i++) {
        let ex = extrinsics[i]
        if (ex.name == 'timestamp.set') {
            return ex.args.now
        }
    }
    return 0
}


export function unwrapArguments(call: sub.Call | sub.Event, registry: eac.Registry): {name: string, args: unknown} {
    let name = toCamelCase(call.__kind) + '.' + call.value.__kind
    let args: unknown
    let def = assertNotNull(registry.definitions[name])
    if (def.fields[0]?.name != null) {
        args = omitKind(call.value)
    } else {
        args = call.value.value
    }
    return {name, args}
}
