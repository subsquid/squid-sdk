import {Metadata} from "@subsquid/substrate-metadata"
import blake2b from "blake2b"


export function blake2bHash(bytes: Uint8Array): Uint8Array {
    let hash = blake2b(32)
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
