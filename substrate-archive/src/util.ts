import {JsonCodec} from "@subsquid/scale-codec"
import {Metadata} from "@subsquid/substrate-metadata"
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {assertNotNull} from "@subsquid/util-internal"
import blake2b from "blake2b"
import {sub} from "./interfaces"
import {Extrinsic} from "./model"


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


/**
 * All blocks have timestamp event except for the genesis block.
 * This method looks up `timestamp.set` and reads off the block timestamp
 */
export function getBlockTimestamp(extrinsics: (Extrinsic & {name: string, args: any})[]): number {
    for (let i = 0; i < extrinsics.length; i++) {
        let ex = extrinsics[i]
        if (ex.name == 'Timestamp.set') {
            return ex.args.now
        }
    }
    return 0
}


export function unwrapArguments(call: sub.Call | sub.Event, registry: eac.Registry): {name: string, args: unknown} {
    let name = call.__kind + '.' + call.value.__kind
    let args: unknown
    let def = assertNotNull(registry.definitions[name])
    if (def.fields[0]?.name != null) {
        args = omitKind(call.value)
    } else {
        args = call.value.value
    }
    return {name, args}
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
