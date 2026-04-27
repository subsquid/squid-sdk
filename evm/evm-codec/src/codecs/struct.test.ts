import {describe, expect, it} from 'vitest'
import {address, array, bytes4, int8, BytesSink, BytesSrc, struct, uint256} from '..'

function roundtrip<T>(codec: {encode: (s: BytesSink, v: T) => void; decode: (s: BytesSrc) => T; slotsCount?: number}, value: T) {
  const sink = new BytesSink(codec.slotsCount ?? 1)
  codec.encode(sink, value)
  expect(codec.decode(new BytesSrc(sink.result()))).toStrictEqual(value)
}

describe('StructCodec', () => {
  it('static tuple', () => {
    roundtrip(
      struct({
        a: int8,
        b: uint256,
        c: struct({e: address}),
      }),
      {
        a: 1,
        b: 2n,
        c: {e: '0x1234567890123456789012345678901234567890'},
      },
    )
  })

  it('dynamic tuple', () => {
    roundtrip(
      struct({
        a: array(uint256),
        b: uint256,
        c: struct({d: array(uint256), e: address}),
      }),
      {
        a: [100n, 1n, 123n],
        b: 2n,
        c: {
          d: [3n, 4n],
          e: '0x1234567890123456789012345678901234567890',
        },
      },
    )
  })

  it('dynamic tuple with bytes4', () => {
    const s = struct({
      foo: uint256,
      bar: array(uint256),
      str: struct({foo: uint256, bar: bytes4}),
    })
    const value = {
      foo: 100n,
      bar: [1n, 2n, 3n],
      str: {
        foo: 123n,
        bar: '0x12345678',
      },
    }
    const sink = new BytesSink(1)
    // `bytes4` accepts either `Uint8Array` or the `0x…`-prefixed hex form
    // on the encode side but always returns the hex form on decode — check
    // both input paths explicitly.
    s.encode(sink, {
      ...value,
      str: {...value.str, bar: Uint8Array.from([0x12, 0x34, 0x56, 0x78])},
    })
    expect(s.decode(new BytesSrc(sink.result()))).toStrictEqual(value)
    roundtrip(s, value)
  })
})
