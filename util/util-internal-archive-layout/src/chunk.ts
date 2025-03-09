import {DataChunkError} from './errors'
import {formatBlockNumber} from './block'


export interface DataChunk {
    /**
     * Containing directory
     */
    top: number
    /**
     * First block of the chunk
     */
    from: number
    /**
     * Last block of the chunk
     */
    to: number
    /**
     * Short hash of the last block in the chunk
     */
    hash: string
}


export function getChunkPath(chunk: DataChunk): string {
    let top = formatBlockNumber(chunk.top)
    let from = formatBlockNumber(chunk.from)
    let to = formatBlockNumber(chunk.to)
    return `${top}/${from}-${to}-${chunk.hash || '000000'}`
}


export function tryParseTop(s: string): number | undefined {
    if (/^\d+$/.test(s)) {
        return parseInt(s)
    }
}


export function tryParseChunkDir(s: string): Omit<DataChunk, 'top'> | undefined {
    let m = /^(\d+)-(\d+)-([0-9a-z]+)$/i.exec(s)
    if (m) {
        let from = parseInt(m[1])
        let to = parseInt(m[2])
        let hash = m[3]
        return {from, to, hash}
    }
}


/**
 * Assert DataChunk invariants
 */
export function assertDataChunk(chunk: DataChunk) {
    let err = getDataChunkErrorMessage(chunk)
    if (err) throw new DataChunkError(
        getChunkPath(chunk),
        err
    )
}


export function getDataChunkErrorMessage(chunk: DataChunk): string {
    if (!Number.isSafeInteger(chunk.top)) return `'top' is not a safe integer`
    if (!Number.isSafeInteger(chunk.from)) return `'from' is not a safe integer`
    if (!Number.isSafeInteger(chunk.to)) return `'to' is not a safe integer`
    if (chunk.top < 0) return 'top < 0'
    if (chunk.top > chunk.from) return 'top > from'
    if (chunk.from > chunk.to) return 'from > to'
    return ''
}
