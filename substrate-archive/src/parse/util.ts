import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {assertNotNull} from "@subsquid/util-internal"
import {sub} from "../interfaces"


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


export function omitKind<T extends {__kind: string}>(obj: T): Omit<T, "__kind"> {
    let {__kind, ...props} = obj
    return props
}


export function unwrapArguments(call: sub.Call | sub.Event, registry: eac.Registry): {name: string, args: unknown} {
    let name = call.__kind + "." + call.value.__kind
    let args: unknown
    let def = assertNotNull(registry.definitions[name])
    if (def.fields[0]?.name != null) {
        args = omitKind(call.value)
    } else {
        args = call.value.value
    }
    return {name, args}
}
