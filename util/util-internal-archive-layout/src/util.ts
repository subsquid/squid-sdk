import {last, waitDrain} from '@subsquid/util-internal'
import {assertRange, Range} from '@subsquid/util-internal-range'
import assert from 'assert'
import {StringDecoder} from 'node:string_decoder'
import zlib from 'zlib'


export async function* splitLines(bytes: AsyncIterable<Buffer>): AsyncIterable<string[]> {
    let splitter = new LineSplitter()
    for await (let buf of bytes) {
        let lines = splitter.push(buf)
        if (lines) yield lines
    }
    let lastLine = splitter.end()
    if (lastLine) yield [lastLine]
}


class LineSplitter {
    private decoder = new StringDecoder('utf-8')
    private line = ''

    push(data: Buffer): string[] | undefined {
        let s = this.decoder.write(data)
        if (!s) return
        let lines = s.split('\n')
        if (lines.length == 1) {
            this.line += lines[0]
        } else {
            let result: string[] = []
            lines[0] = this.line + lines[0]
            this.line = last(lines)
            for (let i = 0; i < lines.length - 1; i++) {
                let line = lines[i]
                if (line) {
                    result.push(line)
                }
            }
            if (result.length > 0) return result
        }
    }

    end(): string | undefined {
        if (this.line) return this.line
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
