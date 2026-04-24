import {describe, expect, it} from 'vitest'
import {Sink, Src} from '.'

describe('src', () => {
  it('negative numbers', () => {
    const sink = new Sink(6)
    sink.i8(-1)
    sink.i16(-123)
    sink.i32(-123456)
    sink.i64(-1234567890n)
    sink.i128(-12345678901234567890n)
    sink.i256(-1234567890123456789012345678901234567890n)

    const src = new Src(sink.result())
    expect(src.i8()).toBe(-1)
    expect(src.i16()).toBe(-123)
    expect(src.i32()).toBe(-123456)
    expect(src.i64()).toBe(-1234567890n)
    expect(src.i128()).toBe(-12345678901234567890n)
    expect(src.i256()).toBe(-1234567890123456789012345678901234567890n)
  })

  it('positive signed numbers', () => {
    const sink = new Sink(6)
    sink.i8(1)
    sink.i16(123)
    sink.i32(123456)
    sink.i64(1234567890n)
    sink.i128(12345678901234567890n)
    sink.i256(1234567890123456789012345678901234567890n)

    const src = new Src(sink.result())
    expect(src.i8()).toBe(1)
    expect(src.i16()).toBe(123)
    expect(src.i32()).toBe(123456)
    expect(src.i64()).toBe(1234567890n)
    expect(src.i128()).toBe(12345678901234567890n)
    expect(src.i256()).toBe(1234567890123456789012345678901234567890n)
  })

  it('mixed static types', () => {
    const sink = new Sink(4)
    sink.u8(1)
    sink.i8(-2)
    sink.address('0x1234567890123456789012345678901234567890')
    sink.u256(3n)

    const src = new Src(sink.result())
    expect(src.u8()).toBe(1)
    expect(src.i8()).toBe(-2)
    expect(src.address()).toBe('0x1234567890123456789012345678901234567890')
    expect(src.u256()).toBe(3n)
  })

  it('mixed dynamic types', () => {
    const str1 = 'abc'.repeat(100)
    const bytes1 = Buffer.alloc(100).fill('321')
    const bytes7 = Buffer.from('1234567890abcd', 'hex')
    const str2 = 'hello'
    const addressValue = '0xabc4567890123456789012345678901234567890'

    // Build a multi-field ABI-encoded blob using Sink, then make sure
    // Src reads every field back in the expected order.
    const sink = new Sink(4)
    sink.newStaticDataArea()
    sink.u8(69)
    sink.string(str1)
    sink.staticBytes(7, bytes7)
    sink.i128(-21312312452243312424534213123123123123n)
    sink.bytes(bytes1)
    sink.address(addressValue)
    sink.string(str2)
    sink.endCurrentDataArea()

    const src = new Src(sink.result())
    expect(src.u8()).toBe(69)
    expect(src.string()).toBe(str1)
    expect(src.staticBytes(7)).toStrictEqual(bytes7)
    expect(src.i128()).toBe(-21312312452243312424534213123123123123n)
    expect(src.bytes()).toStrictEqual(bytes1)
    expect(src.address()).toBe(addressValue)
    expect(src.string()).toBe(str2)
  })

  describe('string', () => {
    function testString(str: string) {
      const sink = new Sink(1)
      sink.newStaticDataArea()
      sink.string(str)
      sink.endCurrentDataArea()
      expect(new Src(sink.result()).string()).toBe(str)
    }

    it('short string', () => testString('hello'))
    it('32 byte string', () => testString('this string length is 32 bytes!!'))
    it('longer string', () => testString('this string length is 33 bytes!!!'))
    it('UTF', () => testString('привет 👍'))
  })

  it('bytes', () => {
    const buffer = Buffer.alloc(150)
    buffer.fill('xd')
    const sink = new Sink(1)
    sink.newStaticDataArea()
    sink.bytes(buffer)
    sink.endCurrentDataArea()
    expect(new Src(sink.result()).bytes()).toStrictEqual(buffer)
  })
})
