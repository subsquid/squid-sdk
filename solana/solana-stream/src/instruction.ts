import {toHex} from '@subsquid/util-internal-hex'
import bs58 from 'bs58'
import {Base58Bytes, Bytes} from './data/model'


export const DATA_SYM = Symbol('DATA')
export const D8_SYM = Symbol('D8')


interface Instruction {
    data: Base58Bytes
    [DATA_SYM]?: Uint8Array
    [D8_SYM]?: Bytes
}


export function getInstructionData(i: Instruction): Uint8Array {
    if (i[DATA_SYM]) return i[DATA_SYM]
    return i[DATA_SYM] = bs58.decode(i.data)
}


export function getInstructionDescriptor(i: Instruction): string {
    if (i[D8_SYM]) return i[D8_SYM]
    let bytes = toHex(getInstructionData(i))
    return i[D8_SYM] = bytes.slice(0, 18)
}
