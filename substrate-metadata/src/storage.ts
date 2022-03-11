import {Ti, Type} from "./types"
import {getTypeHash} from "./types-hashing"
import {sha256} from "./util"


export type StorageHasher =
    "Blake2_128" |
    "Blake2_256" |
    "Blake2_128Concat" |
    "Twox128" |
    "Twox256" |
    "Twox64Concat" |
    "Identity"


export interface StorageItem {
    hashers: StorageHasher[]
    keys: Ti[]
    value: Ti
    modifier: "Optional" | "Default" | "Required"
    fallback: Uint8Array
    docs?: string[]
}


export interface Storage {
    [prefix: string]: {
        [name: string]: StorageItem
    }
}


export function getStorageItemTypeHash(types: Type[], item: StorageItem): string {
    return sha256({
        keys: item.keys.map(k => getTypeHash(types, k)),
        value: getTypeHash(types, item.value),
        optional: item.modifier === 'Optional'
    })
}
