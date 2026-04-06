import type {BlockRef} from '@subsquid/util-internal-data-source'
import {HashAndHeight} from './database'


export function timeInterval(seconds: number): string {
    if (seconds < 60) {
        return Math.round(seconds) + 's'
    }
    let minutes = Math.ceil(seconds/60)
    if (minutes < 60) {
        return  minutes+'m'
    }
    let hours = Math.floor(minutes / 60)
    minutes = minutes - hours * 60
    return hours + 'h ' + minutes + 'm'
}


export function getItemsCount(blocks: any[]): number {
    let count = 0
    for (let block of blocks) {
        for (let key in block) {
            let val = block[key]
            if (Array.isArray(val)) {
                count += val.length
            }
        }
    }
    return count
}


export function formatHead(head: BlockRef): string {
    return `${head.number}#${shortHash(head.hash)}`
}


export function shortHash(hash: string): string {
    if (hash.startsWith('0x')) {
        return hash.slice(2, 7)
    } else {
        return hash.slice(0, 5)
    }
}
