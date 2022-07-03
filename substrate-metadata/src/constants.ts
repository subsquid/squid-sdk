import {Ti} from "./types"


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
