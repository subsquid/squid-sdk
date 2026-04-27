import {describe, expect, it} from 'vitest'
import {BytesSink, BytesSrc} from '..'

describe('sink', () => {
  it('negative numbers round-trip through Src', () => {
    const sink = new BytesSink(6)
    sink.i8(-1)
    sink.i16(-123)
    sink.i32(-123456)
    sink.i64(-1234567890n)
    sink.i128(-12345678901234567890n)
    sink.i256(-1234567890123456789012345678901234567890n)

    const src = new BytesSrc(sink.result())
    expect(src.i8()).toBe(-1)
    expect(src.i16()).toBe(-123)
    expect(src.i32()).toBe(-123456)
    expect(src.i64()).toBe(-1234567890n)
    expect(src.i128()).toBe(-12345678901234567890n)
    expect(src.i256()).toBe(-1234567890123456789012345678901234567890n)
  })

  it('number overflow', () => {
    const sink = new BytesSink(1)
    expect(() => sink.u8(0x1234567890)).toThrowError('78187493520 is out of bounds for uint8[0, 255]')
    expect(() => sink.i8(0x1234567890)).toThrowError('78187493520 is out of bounds for int8[-128, 127]')
    expect(() => sink.u16(0x1234567890)).toThrowError('78187493520 is out of bounds for uint16[0, 65535]')
    expect(() => sink.i16(0x1234567890)).toThrowError('78187493520 is out of bounds for int16[-32768, 32767]')
    expect(() => sink.u32(0x1234567890)).toThrowError('78187493520 is out of bounds for uint32[0, 4294967295]')
    expect(() => sink.i32(0x1234567890)).toThrowError('78187493520 is out of bounds for int32[-2147483648, 2147483647]')
  })

  it('mixed static types round-trip through Src', () => {
    const sink = new BytesSink(5)
    sink.u8(1)
    sink.i8(-2)
    sink.address('0x1234567890123456789012345678901234567890')
    sink.u256(3n)
    sink.staticBytes(7, Buffer.from('1234567890abcd', 'hex'))

    const src = new BytesSrc(sink.result())
    expect(src.u8()).toBe(1)
    expect(src.i8()).toBe(-2)
    expect(src.address()).toBe('0x1234567890123456789012345678901234567890')
    expect(src.u256()).toBe(3n)
    expect(src.staticBytes(7)).toStrictEqual(new Uint8Array(Buffer.from('1234567890abcd', 'hex')))
  })

  describe('string', () => {
    function testString(value: string) {
      const sink = new BytesSink(1)
      sink.openTail()
      sink.string(value)
      sink.closeTail()
      expect(new BytesSrc(sink.result()).string()).toBe(value)
    }

    it('short string', () => testString('hello'))
    it('32 byte string', () => testString('this string length is 32 bytes!!'))
    it('longer string', () => testString('this string length is 33 bytes!!!'))
    it('UTF', () => testString('привет 👍'))
  })

  it('bytes', () => {
    const sink = new BytesSink(1)
    sink.openTail()
    const buffer = Buffer.alloc(150)
    buffer.fill('xd')
    sink.bytes(buffer)
    sink.closeTail()
    expect(new BytesSrc(sink.result()).bytes()).toStrictEqual(new Uint8Array(buffer))
  })

  it('string encodes to canonical 32-byte-aligned ABI layout', () => {
    // Pin the exact on-wire layout for one value so we catch regressions
    // in the offset/length word without needing an external reference
    // implementation on the hot path.
    const sink = new BytesSink(1)
    sink.openTail()
    sink.string('hello')
    sink.closeTail()
    expect(sink.toString()).toBe(
      '0x' +
        // offset to the dynamic region (0x20)
        '0000000000000000000000000000000000000000000000000000000000000020' +
        // length (5)
        '0000000000000000000000000000000000000000000000000000000000000005' +
        // "hello" left-aligned, zero-padded to 32 bytes
        '68656c6c6f000000000000000000000000000000000000000000000000000000',
    )
  })
})
