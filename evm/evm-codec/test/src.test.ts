import { describe, expect, it } from 'vitest'
import { Sink, Src } from '../src'
import { encodeAbiParameters } from 'viem'

describe('src', () => {
  it('negative numbers', () => {
    const sink = new Sink(6)
    sink.i256(-1n)
    sink.i256(-123n)
    sink.i256(-123456n)
    sink.i256(-1234567890n)
    sink.i256(-12345678901234567890n)
    sink.i256(-1234567890123456789012345678901234567890n)

    const src = new Src(sink.result())
    expect(src.i256()).toBe(-1n)
    expect(src.i256()).toBe(-123n)
    expect(src.i256()).toBe(-123456n)
    expect(src.i256()).toBe(-1234567890n)
    expect(src.i256()).toBe(-12345678901234567890n)
    expect(src.i256()).toBe(-1234567890123456789012345678901234567890n)
  })

  it('positive signed numbers', () => {
    const sink = new Sink(6)
    sink.i256(1n)
    sink.i256(123n)
    sink.i256(123456n)
    sink.i256(1234567890n)
    sink.i256(12345678901234567890n)
    sink.i256(1234567890123456789012345678901234567890n)

    const src = new Src(sink.result())
    expect(src.i256()).toBe(1n)
    expect(src.i256()).toBe(123n)
    expect(src.i256()).toBe(123456n)
    expect(src.i256()).toBe(1234567890n)
    expect(src.i256()).toBe(12345678901234567890n)
    expect(src.i256()).toBe(1234567890123456789012345678901234567890n)
  })

  it('mixed static types', () => {
    const sink = new Sink(4)
    sink.nat(1)
    sink.i256(-2n)
    sink.u256(3n)

    const src = new Src(sink.result())
    expect(src.nat()).toBe(1)
    expect(src.i256()).toBe(-2n)
    expect(src.u256()).toBe(3n)
  })

  it('mixed dynamic types', () => {
    const str1 = 'abc'.repeat(100)
    const bytes1 = Buffer.alloc(100).fill('321')
    const bytes7 = '0x1234567890abcd'
    const str2 = 'hello'
    const encoded = Buffer.from(
      encodeAbiParameters(
        [
          { type: 'uint8' },
          { type: 'string' },
          { type: 'bytes7' },
          { type: 'int128' },
          { type: 'bytes' },
          { type: 'string' },
        ],
        [69, str1, bytes7, -21312312452243312424534213123123123123n, `0x${bytes1.toString('hex')}`, str2],
      ).slice(2),
      'hex',
    )
    const src = new Src(encoded)
    expect(src.nat()).toBe(69)
    expect(src.string()).toBe(str1)
    expect(src.staticBytes()).toStrictEqual(
      Buffer.from('1234567890abcd00000000000000000000000000000000000000000000000000', 'hex'),
    )
    expect(src.i256()).toBe(-21312312452243312424534213123123123123n)
    expect(src.bytes()).toStrictEqual(bytes1)
    expect(src.string()).toBe(str2)
  })

  describe('string', () => {
    function testString(str: string) {
      const encoded = Buffer.from(encodeAbiParameters([{ type: 'string' }], [str]).slice(2), 'hex')
      const src = new Src(encoded)
      expect(src.string()).toBe(str)
    }

    it('short string', () => {
      testString('hello')
    })

    it('32 byte string', () => {
      testString('this string length is 32 bytes!!')
    })

    it('longer string', () => {
      testString('this string length is 33 bytes!!!')
    })

    it('UTF', () => {
      testString('привет 👍')
    })
  })

  it('bytes', () => {
    const buffer = Buffer.alloc(150)
    buffer.fill('xd')
    const encoded = Buffer.from(
      encodeAbiParameters([{ type: 'bytes' }], [`0x${buffer.toString('hex')}`]).slice(2),
      'hex',
    )
    const src = new Src(encoded)
    expect(src.bytes()).toStrictEqual(buffer)
  })
})
