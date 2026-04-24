import {describe, expect, it} from 'vitest'
import {address, array, bytes, fixedSizeArray, int8, Sink, Src, string, uint256} from '..'

function roundtrip<T>(codec: {encode: (s: Sink, v: T) => void; decode: (s: Src) => T; slotsCount?: number}, value: T) {
  const sink = new Sink(codec.slotsCount ?? 1)
  codec.encode(sink, value)
  expect(codec.decode(new Src(sink.result()))).toStrictEqual(value)
}

describe('fixed size array', () => {
  it('static types', () => {
    roundtrip(fixedSizeArray(int8, 5), [1, 2, -3, 4, 5])
    roundtrip(fixedSizeArray(int8, 5), [1, 2, -3, -4, 5])
  })

  it('dynamic types', () => {
    const arr = fixedSizeArray(string, 3)
    roundtrip(arr, [
      'aaa',
      'a relatively long string to test what happens when the string is long, longer than 32 bytes or even better, longer than 64 bytes!!!',
      'dasdas',
    ])
  })

  it('deep nested arrays', () => {
    const arr = fixedSizeArray(fixedSizeArray(string, 3), 2)
    const data = [
      'aaa',
      'a relatively long string to test what happens when the string is long, longer than 32 bytes or even better, longer than 64 bytes!!!',
      'dasdas',
    ]
    roundtrip(arr, [data, [...data].reverse()])
  })
})

describe('dynamic size array', () => {
  it('static types', () => {
    roundtrip(array(int8), [1, 2, -3, 4, 5])
    roundtrip(array(int8), [1, 2, -3, -4, 5])
  })

  it('array of arrays', () => {
    roundtrip(array(array(int8)), [
      [1, 2, -3, -4, 5],
      [1, 2, -3, -4, 5],
    ])
  })

  it('dynamic types', () => {
    roundtrip(array(string), [
      'aaa',
      'a relatively long string to test what happens when the string is long, longer than 32 bytes or even better, longer than 64 bytes!!!',
      'dasdas',
    ])
  })

  it('hardcore dynamic types', () => {
    const sink = new Sink(5)
    const arr1 = array(array(fixedSizeArray(string, 3)))
    const arr2 = array(array(uint256))
    const arr3 = array(fixedSizeArray(bytes, 2))
    const data1 = [
      [
        ['aaa', 'bbb', 'ccc'],
        ['ddd', 'eee', 'fff'],
      ],
      [['ggg', 'hhh', 'iii']],
    ]
    const data2 = [[1n, 2n, 3n], [], [4n]]
    const data3 = [
      ['0x1234', '0x5678'],
      ['0xdead', '0xbeef'],
    ]
    arr1.encode(sink, data1)
    address.encode(sink, '0x1234567890123456789012345678901234567890')
    arr3.encode(sink, data3)
    arr2.encode(sink, data2)
    uint256.encode(sink, 123n)

    const src = new Src(sink.result())
    expect(arr1.decode(src)).toStrictEqual(data1)
    expect(address.decode(src)).toBe('0x1234567890123456789012345678901234567890')
    expect(arr3.decode(src)).toStrictEqual(data3)
    expect(arr2.decode(src)).toStrictEqual(data2)
    expect(uint256.decode(src)).toBe(123n)
  })
})
