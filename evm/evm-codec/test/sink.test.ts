import { describe, expect, it } from 'vitest'
import { AbiParameter, encodeAbiParameters } from 'viem'
import { Sink } from '../src'

describe('sink', () => {
  function compareTypes(sink: Sink, types: AbiParameter[], values: any[]) {
    expect(sink.toString()).toEqual(encodeAbiParameters(types, values))
  }

  it('negative numbers', () => {
    const sink = new Sink(6)
    sink.i8(-1)
    sink.i16(-123)
    sink.i32(-123456)
    sink.i64(-1234567890n)
    sink.i128(-12345678901234567890n)
    sink.i256(-1234567890123456789012345678901234567890n)
    compareTypes(
      sink,
      [
        { type: 'int8' },
        { type: 'int16' },
        { type: 'int32' },
        { type: 'int64' },
        { type: 'int128' },
        { type: 'int256' },
      ],
      [-1, -123, -123456, -1234567890n, -12345678901234567890n, -1234567890123456789012345678901234567890n],
    )
  })

  it('number overflow', () => {
    const sink = new Sink(1)
    expect(() => sink.u8(0x1234567890)).toThrowError('78187493520 is out of bounds for uint8[0, 255]')
    expect(() => sink.i8(0x1234567890)).toThrowError('78187493520 is out of bounds for int8[-128, 127]')
    expect(() => sink.u16(0x1234567890)).toThrowError('78187493520 is out of bounds for uint16[0, 65535]')
    expect(() => sink.i16(0x1234567890)).toThrowError('78187493520 is out of bounds for int16[-32768, 32767]')
    expect(() => sink.u32(0x1234567890)).toThrowError('78187493520 is out of bounds for uint32[0, 4294967295]')
    expect(() => sink.i32(0x1234567890)).toThrowError('78187493520 is out of bounds for int32[-2147483648, 2147483647]')
  });

  it('mixed types', () => {
    const sink = new Sink(5)
    sink.u8(1)
    sink.i8(-2)
    sink.address('0x1234567890123456789012345678901234567890')
    sink.u256(3n)
    sink.staticBytes(7, Buffer.from('1234567890abcd', 'hex'))
    compareTypes(
      sink,
      [{ type: 'uint8' }, { type: 'int8' }, { type: 'address' }, { type: 'uint256' }, { type: 'bytes7' }],
      [1, -2, '0x1234567890123456789012345678901234567890', 3n, '0x1234567890abcd'],
    )
  })

  describe('string', () => {
    it('short string', () => {
      const sink = new Sink(1)
      sink.newStaticDataArea()
      sink.string('hello')
      sink.endCurrentDataArea()
      compareTypes(sink, [{ type: 'string' }], ['hello'])
    })

    it('32 byte string', () => {
      const sink = new Sink(1)
      sink.newStaticDataArea()
      sink.string('this string length is 32 bytes!!')
      sink.endCurrentDataArea()
      compareTypes(sink, [{ type: 'string' }], ['this string length is 32 bytes!!'])
    })

    it('longer string', () => {
      const sink = new Sink(1)
      sink.newStaticDataArea()
      sink.string('this string length is 33 bytes!!!')
      sink.endCurrentDataArea()
      compareTypes(sink, [{ type: 'string' }], ['this string length is 33 bytes!!!'])
    })

    it('UTF', () => {
      const sink = new Sink(1)
      sink.newStaticDataArea()
      sink.string('привет 👍')
      sink.endCurrentDataArea()
      compareTypes(sink, [{ type: 'string' }], ['привет 👍'])
    })
  })

  it('bytes', () => {
    const sink = new Sink(1)
    sink.newStaticDataArea()
    const buffer = Buffer.alloc(150)
    buffer.fill('xd')
    sink.bytes(buffer)
    sink.endCurrentDataArea()
    compareTypes(sink, [{ type: 'bytes' }], [`0x${buffer.toString('hex')}`])
  })
})
