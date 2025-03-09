export interface BlockRef {
    hash: string
    number: number
    parentNumber?: number
}


export type RawBlock = {
    hash: string
    number: number
    parentNumber?: number
    height?: number
} | {
    hash: string
    height: number
    number?: undefined
    parentNumber?: undefined
}


export function peekBlockRef(block: RawBlock): BlockRef {
    if (block.number == null) {
        return {
            hash: block.hash,
            number: block.height
        }
    } else {
        return {
            hash: block.hash,
            number: block.number,
            parentNumber: block.parentNumber
        }
    }
}


export function getBlockNumber(block: RawBlock): number {
    return block.number == null ? block.height : block.number
}


export function getParentBlockNumber(block: RawBlock): number {
    return block.parentNumber ?? getBlockNumber(block) - 1
}


export function checkShorHashMatch(a: string, b: string): boolean {
    let short: string
    let long: string
    if (a.length < b.length) {
        short = a
        long = b
    } else {
        short = b
        long = a
    }
    return long.startsWith(short) || long.endsWith(short)
}


export function getShortHash(hash: string): string {
    return hash.slice(-8)
}


export function formatBlockNumber(number: number): string {
    return String(number).padStart(10, '0')
}
