import {StringDecoder} from 'node:string_decoder'


export class LineSplitter {
    private decoder = new StringDecoder('utf-8')
    private line = ''

    constructor(private cb: (line: string) => void) {}

    push(data: Uint8Array): void {
        let offset = 0
        for (let i = 0; i < data.length; i++) {
            if (data[i] == 10) { // \n
                this.pushLine(data, offset, i)
                offset = i + 1
            }
        }
        if (offset < data.length) {
            this.line += this.decoder.write(data.subarray(offset))
        }
    }

    private pushLine(data: Uint8Array, offset: number, end: number): void {
        let line = this.line + this.decoder.end(data.subarray(offset, end))
        this.line = ''
        if (line) {
            this.cb(line)
        }
    }

    end(): void {
        let line = this.line + this.decoder.end()
        this.line = ''
        if (line) {
            this.cb(line)
        }
    }
}
