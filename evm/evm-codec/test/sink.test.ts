import { describe, expect, it } from 'vitest'
import { AbiParameter, encodeAbiParameters } from 'viem'
import { Sink } from '../src'

describe('sink', () => {
  function compareTypes(sink: Sink, types: AbiParameter[], values: any[]) {
    expect(sink.toString()).toEqual(encodeAbiParameters(types, values))
  }

  it('negative numbers', () => {
    const sink = new Sink(6)
    sink.i256(-1n)
    sink.i256(-123n)
    sink.i256(-123456n)
    sink.i256(-1234567890n)
    sink.i256(-12345678901234567890n)
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

  it('mixed types', () => {
    const sink = new Sink(4)
    sink.nat(1)
    sink.i256(-2n)
    sink.u256(3n)
    sink.staticBytes(Buffer.from('1234567890abcd', 'hex'))
    compareTypes(
      sink,
      [{ type: 'uint8' }, { type: 'int8' }, { type: 'uint256' }, { type: 'bytes7' }],
      [1, -2, 3n, '0x1234567890abcd'],
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
