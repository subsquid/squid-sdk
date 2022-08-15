import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {assertNotNull} from "@subsquid/util-internal"
import {toHex} from "@subsquid/util-internal-hex"
import {sub} from "../interfaces"
import type {Account} from "./validator"


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


export function formatEvmLogId(height: number, index: number): string {
    const blockPart = `${String(height).padStart(10, "0")}`
    const indexPart = `${String(index).padStart(6, "0")}`
    return `${blockPart}-${indexPart}`
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


export function getDispatchInfoFromExtrinsicSuccess(args: any): sub.DispatchInfo {
    if (args.dispatchInfo) {
        return args.dispatchInfo
    } else {
        return args
    }
}


export function getDispatchInfoFromExtrinsicFailed(args: any): sub.DispatchInfo {
    if (args.dispatchInfo) {
        return args.dispatchInfo
    } else {
        return assertNotNull(args[1])
    }
}


export function getExtrinsicFailedError(args: any): unknown {
    if (args.dispatchError) {
        return args.dispatchError
    } else {
        return assertNotNull(args[0])
    }
}


export function addressOrigin(address: any): sub.SignedOrigin | undefined {
    if (address instanceof Uint8Array) {
        return signedOrigin(address)
    }
    switch(address.__kind) {
        case 'Id':
        case 'AccountId': // LookupSource as an address on early kusama blocks
            return signedOrigin(address.value)
    }
}


export function signedOrigin(account: Account): sub.SignedOrigin {
    return {
        __kind: 'system',
        value: {
            __kind: 'Signed',
            value: account
        }
    }
}


export function rootOrigin(): sub.RootOrigin {
    return {
        __kind: 'system',
        value: {
            __kind: 'Root'
        }
    }
}


export function noneOrigin(): sub.NoneOrigin {
    return {
        __kind: 'system',
        value: {
            __kind: 'None'
        }
    }
}


export function extractEthereumTxContract(tx: any): string | undefined {
    let action = assertNotNull(tx.action || tx.value.action)
    if (action.__kind == 'Call') {
        return toHex(action.value)
    }
}


export function extractEthCallContract(args: any): string | undefined {
    let action = assertNotNull(args.action)
    if (action.__kind == 'Call') {
        return toHex(action.value)
    }
}
