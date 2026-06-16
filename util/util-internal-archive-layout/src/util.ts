import {waitDrain} from '@subsquid/util-internal'
import {assertRange, Range} from '@subsquid/util-internal-range'
import assert from 'assert'
import zlib from 'zlib'


export async function* splitBufferLines(bytes: AsyncIterable<Buffer>): AsyncIterable<Buffer[]> {
    let splitter = new BufferLineSplitter()
    for await (let buf of bytes) {
        let lines = splitter.push(buf)
        if (lines && lines.length > 0) yield lines
    }
    let lastLine = splitter.end()
    if (lastLine) yield [lastLine]
}


class BufferLineSplitter {
    private pending: Buffer[] = []

    push(data: Buffer): Buffer[] | undefined {
        let lines: Buffer[] = []
        let start = 0

        for (let i = 0; i < data.length; i++) {
            if (data[i] === 0x0A) {
                if (this.pending.length > 0) {
                    this.pending.push(data.subarray(start, i))
                    lines.push(Buffer.concat(this.pending))
                    this.pending = []
                } else {
                    lines.push(data.subarray(start, i))
                }
                start = i + 1
            }
        }

        if (start < data.length) {
            this.pending.push(Buffer.from(data.subarray(start)))
        }

        return lines.length > 0 ? lines : undefined
    }

    end(): Buffer | undefined {
        if (this.pending.length === 0) return undefined
        return Buffer.concat(this.pending)
    }
}


export class GzipBuffer {
    private stream = zlib.createGzip()
    private buf: Buffer[] = []
    private size = 0

    constructor() {
        this.stream.on('data', chunk => {
            this.buf.push(chunk)
            this.size += chunk.length
        })
    }

    write(content: string): void {
        this.stream.write(content)
    }

    drain(): Promise<void> {
        return waitDrain(this.stream)
    }

    getSize(): number {
        return this.size
    }

    end(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.stream.on('error', reject)
            this.stream.on('end', () => {
                resolve(Buffer.concat(this.buf))
            })
            this.stream.end()
        })
    }
}


export function getRange(range?: Range): {from: number, to: number} {
    let from = 0
    let to = Infinity
    if (range) {
        assertRange(range)
        from = range.from
        to = range.to ?? Infinity
    }
    return {from, to}
}


export function* pack<T>(items: T[], size: number): Iterable<T[]> {
    assert(size > 0)

    let offset = 0
    let end = size

    while (end <= items.length) {
        yield items.slice(offset, end)
        offset = end
        end = offset + size
    }

    items.splice(0, offset)
}
