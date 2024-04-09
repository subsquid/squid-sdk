import {HashAndHeight} from './interfaces'


export type BlockRef = HashAndHeight | {
    height: number
    hash?: undefined
} | {
    height?: undefined
    hash: string
}


export function getBlockName(ref: BlockRef): string {
    if (ref.hash == null) {
        return ''+ref.height
    } else if (ref.height == null) {
        return ref.hash
    } else {
        return `${ref.height}#${shortHash(ref.hash)}`
    }
}


function shortHash(hash: string): string {
    if (hash.startsWith('0x')) {
        return hash.slice(2, 7)
    } else {
        return hash.slice(0, 5)
    }
}
