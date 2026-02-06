import {Base58Bytes} from '@subsquid/solana-stream'


export interface HashAndNumber {
    hash: Base58Bytes
    number: number
}


export function formatId(block: HashAndNumber, ...address: number[]): string {
    let no = block.number.toString().padStart(12, '0')
    let hash = block.hash.slice(0, 5)
    let id = `${no}-${hash}`
    for (let index of address) {
        id += '-' + index.toString().padStart(6, '0')
    }
    return id
}
