import {WORD_SIZE, type Src} from '../codec'

const HEX_BYTE = 2
const WORD_HEX = WORD_SIZE * HEX_BYTE

const I64_SIGN_BIT = 1n << 63n
const I64_RANGE = 1n << 64n
const I128_SIGN_BIT = 1n << 127n
const I128_RANGE = 1n << 128n
const I256_SIGN_BIT = 1n << 255n
const I256_RANGE = 1n << 256n

const TEXT_DECODER = new TextDecoder('utf-8')

export class HexSrc implements Src {
    private readonly buf: string
    private readonly base: number
    private readonly endChar: number
    private pos: number
    private oldPos: number

    constructor(hex: string, strOffset = 2, strEnd: number = hex.length) {
        this.buf = hex
        this.base = strOffset
        this.endChar = strEnd
        this.pos = strOffset
        this.oldPos = strOffset
    }

    slice(start: number, end?: number): HexSrc {
        const s = this.base + HEX_BYTE * start
        const e = end == null ? this.endChar : this.base + HEX_BYTE * end
        return new HexSrc(this.buf, s, e)
    }

    u8(): number {
        const start = this.pos + WORD_HEX - 2
        const val = Number.parseInt(this.buf.slice(start, start + 2), 16)
        this.pos += WORD_HEX
        return val
    }

    i8(): number {
        return Number(this.i256())
    }

    u16(): number {
        const start = this.pos + WORD_HEX - 4
        const val = Number.parseInt(this.buf.slice(start, start + 4), 16)
        this.pos += WORD_HEX
        return val
    }

    i16(): number {
        return Number(this.i256())
    }

    u32(): number {
        const start = this.pos + WORD_HEX - 8
        const val = Number.parseInt(this.buf.slice(start, start + 8), 16)
        this.pos += WORD_HEX
        return val
    }

    i32(): number {
        return Number(this.i256())
    }

    u64(): bigint {
        const start = this.pos + WORD_HEX - 16
        const val = BigInt(`0x${this.buf.slice(start, start + 16)}`)
        this.pos += WORD_HEX
        return val
    }

    i64(): bigint {
        const raw = this.u64()
        return raw < I64_SIGN_BIT ? raw : raw - I64_RANGE
    }

    u128(): bigint {
        const start = this.pos + WORD_HEX - 32
        const val = BigInt(`0x${this.buf.slice(start, start + 32)}`)
        this.pos += WORD_HEX
        return val
    }

    i128(): bigint {
        const raw = this.u128()
        return raw < I128_SIGN_BIT ? raw : raw - I128_RANGE
    }

    u256(): bigint {
        const val = BigInt(`0x${this.buf.slice(this.pos, this.pos + WORD_HEX)}`)
        this.pos += WORD_HEX
        return val
    }

    i256(): bigint {
        const raw = this.u256()
        return raw < I256_SIGN_BIT ? raw : raw - I256_RANGE
    }

    address(): string {
        const start = this.pos + WORD_HEX - 40
        const val = `0x${this.buf.slice(start, start + 40)}`
        this.pos += WORD_HEX
        return val
    }

    bytes(): Uint8Array {
        const ptr = this.u32()
        this.jump(ptr)
        const len = Number(this.u256())
        this.#assertLength(len, 'bytes')
        const sub = this.buf.slice(this.pos, this.pos + HEX_BYTE * len)
        const val = Buffer.from(sub, 'hex')
        this.jumpBack()
        return val
    }

    bytesHex(): string {
        const ptr = this.u32()
        this.jump(ptr)
        const len = Number(this.u256())
        this.#assertLength(len, 'bytes')
        const val = `0x${this.buf.slice(this.pos, this.pos + HEX_BYTE * len)}`
        this.jumpBack()
        return val
    }

    staticBytes(len: number): Uint8Array {
        if (len > 32) {
            throw new Error(`bytes${len} is not a valid type`)
        }
        const sub = this.buf.slice(this.pos, this.pos + HEX_BYTE * len)
        this.pos += WORD_HEX
        return Buffer.from(sub, 'hex')
    }

    staticBytesHex(len: number): string {
        if (len > 32) {
            throw new Error(`bytes${len} is not a valid type`)
        }
        const val = `0x${this.buf.slice(this.pos, this.pos + HEX_BYTE * len)}`
        this.pos += WORD_HEX
        return val
    }

    string(): string {
        const ptr = this.u32()
        this.jump(ptr, 'string')
        const len = Number(this.u256())
        this.#assertLength(len, 'string')
        const sub = this.buf.slice(this.pos, this.pos + HEX_BYTE * len)
        const val = TEXT_DECODER.decode(Buffer.from(sub, 'hex'))
        this.jumpBack()
        return val
    }

    bool(): boolean {
        const a = this.buf.charCodeAt(this.pos + WORD_HEX - 2)
        const b = this.buf.charCodeAt(this.pos + WORD_HEX - 1)
        this.pos += WORD_HEX
        return a !== 48 /* '0' */ || b !== 48
    }

    #assertLength(len: number, typeName: string): void {
        if (this.endChar - this.pos < HEX_BYTE * len) {
            throw new RangeError(
                `Unexpected end of input. Attempting to read ${typeName} of length ${len} from 0x${this.buf.slice(this.base, this.endChar)}`,
            )
        }
    }

    jump(pos: number, typeName?: string): void {
        const target = this.base + HEX_BYTE * pos
        if (pos < 0 || target >= this.endChar) {
            const what = typeName ? `${typeName} ` : ''
            throw new RangeError(
                `Unexpected pointer location: 0x${pos.toString(16)}. Attempting to read ${what}from 0x${this.buf.slice(this.base, this.endChar)}`,
            )
        }
        this.oldPos = this.pos
        this.pos = target
    }

    jumpBack(): void {
        this.pos = this.oldPos
    }
}
