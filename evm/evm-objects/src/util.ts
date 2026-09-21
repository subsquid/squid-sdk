import {Bytes32} from '@subsquid/evm-stream'


export interface HashAndNumber {
    hash: Bytes32
    number: number
}


export function shortHash(hash: string): string {
    if (hash.startsWith('0x')) {
        return hash.slice(2, 7)
    } else {
        return hash.slice(0, 5)
    }
}


export function formatId(block: HashAndNumber, ...address: number[]): string {
    let no = block.number.toString().padStart(10, '0')
    let hash = shortHash(block.hash)
    let id = `${no}-${hash}`
    for (let index of address) {
        id += '-' + index.toString().padStart(6, '0')
    }
    return id
}
