import * as fs from "fs"
import { StringDecoder } from "string_decoder"


export function* readLines(file: string): Generator<string> {
    let decoder = new StringDecoder()
    let prev = ''
    let pos = 0
    let len = 0
    let buf = Buffer.alloc(1024 * 1024)
    while (len = read(file, buf, pos)) {
        pos += len
        let text = decoder.write(buf.subarray(0, len))
        let lines = text.split(/[\r\n]/)
        lines[0] = prev + lines[0]
        for (let i = 0; i < lines.length - 1; i++) {
            if (!isWhiteSpace(lines[i])) {
                yield lines[i]
            }
        }
        prev = lines[lines.length - 1]
    }
    {
        let text = decoder.end()
        let lines = text.split(/[\r\n]/)
        lines[0] = prev + lines[0]
        for (let line of lines) {
            if (!isWhiteSpace(line)) {
                yield line
            }
        }
    }
}


function read(file: string, buf: Buffer, pos: number): number {
    let fd = fs.openSync(file, 'r')
    try {
        let offset = 0
        let len = 0
        while (buf.length - offset > 0 && (len = fs.readSync(fd, buf, offset, buf.length - offset, pos))) {
            pos += len
            offset += len
        }
        return offset
    } finally {
        fs.closeSync(fd)
    }
}


function isWhiteSpace(text: string): boolean {
    return /^\s*$/.test(text)
}
