import {Bytes} from '@subsquid/fuel-stream'


export interface HashAndHeight {
    hash: Bytes
    height: number
}


export function formatId(block: HashAndHeight, ...address: number[]): string {
    let no = block.height.toString().padStart(12, '0')
    let hash = block.hash.slice(0, 5)
    let id = `${no}-${hash}`
    for (let index of address) {
        id += '-' + index.toString().padStart(6, '0')
    }
    return id
}
