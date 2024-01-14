
export class Patch {
    private pos = 0
    private locations?: [beg: number, end: number][]

    constructor(private s: string) {}

    scan(): void {
        while (this.pos < this.s.length) {
            switch(this.code()) {
                case 0x22: // "
                    this.pos += 1
                    this.eatString()
                    break
                case 0x2d: // -
                case 0x30: // 0 - 9
                case 0x31:
                case 0x32:
                case 0x33:
                case 0x34:
                case 0x35:
                case 0x36:
                case 0x37:
                case 0x38:
                case 0x39:
                    this.eatNumber()
                    break
                default:
                    this.pos += 1
            }
        }
    }

    private eatNumber(): void {
        let offset = this.pos
        let isInteger = true

        if (this.code() == 0x2d) { // -
            this.pos += 1
        }

        this.expectDigits()

        if (this.code() == 0x2e) { // . ; fraction
            this.pos += 1
            this.expectDigits()
            isInteger = false
        }

        if (this.code() == 0x65 || this.code() == 0x45) { // e E ; exponent
            this.pos += 1
            if (this.code() == 0x2d || this.code() == 0x2b) { // + -
                this.pos += 1
            }
            this.expectDigits()
            isInteger = false
        }

        if (isInteger) {
            let num = parseInt(this.s.slice(offset, this.pos))
            if (!Number.isSafeInteger(num)) {
                this.patch(offset, this.pos)
            }
        }
    }

    private expectDigits(): void {
        let offset = this.pos
        while (true) {
            let code = this.code()
            if (0x30 <= code && code <= 0x39) {
                this.pos += 1
            } else if (offset == this.pos) {
                this.fail('digit expected')
            } else {
                return
            }
        }
    }

    private eatString(): void {
        while (this.pos < this.s.length) {
            let code = this.code()
            this.pos += 1
            switch(code) {
                case 0x22: // "
                    return
                case 0x5c: // \ (escape)
                    this.eatEscape()
                    break
            }
        }
    }

    private eatEscape(): void {
        switch(this.code()) {
            case 0x22:
            case 0x5c:
            case 0x2f:
            case 0x62:
            case 0x66:
            case 0x6e:
            case 0x72:
            case 0x74:
                this.pos += 1
                return
            case 0x75: // u
                this.pos += 1
                for (let i = 0; i < 4; i++) {
                    this.eatHexDigit()
                }
                return
            default:
                this.fail('invalid escape sequence')
        }
    }

    private eatHexDigit(): void {
        let code = this.code()
        if (0x30 <= code && code <= 0x39 || 0x41 <= code && code <= 0x46 || 0x61 <= code && code <= 0x66) {
            this.pos += 1
        } else {
            this.fail('hex digit expected')
        }
    }

    private code(): number {
        return this.s.charCodeAt(this.pos)
    }

    private fail(msg: string): never {
        throw new Error(`JSON syntax error at ${this.pos + 1}: ${msg}`)
    }

    private patch(beg: number, end: number): void {
        if (this.locations == null) {
            this.locations = [[beg, end]]
        } else {
            this.locations.push([beg, end])
        }
    }

    result(): string {
        if (this.locations == null) return this.s
        let result = ''
        let offset = 0
        for (let [beg, end] of this.locations) {
            result += this.s.slice(offset, beg)
            result += '"'
            result += this.s.slice(beg, end)
            result += '"'
            offset = end
        }
        result += this.s.slice(offset)
        return result
    }
}
