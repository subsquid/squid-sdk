import {Ti, Type} from "./types"
import {getTypeHash} from "./types-hashing"
import {sha256} from "./util"


export interface Constants {
    [pallet: string]: {
        [name: string]: Constant
    }
}


export interface Constant {
    type: Ti
    value: Uint8Array
    docs: string[]
}


export function getConstantTypeHash(types: Type[], item: Constant): string {
    return sha256({
        type: getTypeHash(types, item.type)
    })
}
