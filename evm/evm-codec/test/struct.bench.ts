import { bench, describe } from 'vitest'
import { address, array, Codec, Sink, Src, struct, uint256 } from '../src'
import { decodeAbiParameters, encodeAbiParameters } from 'viem'
import { ethers } from 'ethers'

const hugeArray = Array.from({ length: 1000 }, (_, i) => BigInt(i))

const s = struct({
  a: array(uint256),
  b: uint256,
  c: struct({ d: array(uint256), e: address }),
})

describe('StructCodec - encoding', () => {
  bench('encoding dynamic tuple', () => {
    const sink1 = new Sink(1)

    s.encode(sink1, {
      a: hugeArray,
      b: 2n,
      c: {
        d: hugeArray,
        e: '0x1234567890123456789012345678901234567890',
      },
    })
  })

  bench('viem - encoding dynamic tuple', () => {
    encodeAbiParameters(
      [
        {
          type: 'tuple',
          components: [
            { name: 'a', type: 'uint256[]' },
            { name: 'b', type: 'uint256' },
            {
              name: 'c',
              type: 'tuple',
              components: [
                { name: 'd', type: 'uint256[]' },
                { name: 'e', type: 'address' },
              ],
            },
          ],
        },
      ],
      [
        {
          a: hugeArray,
          b: 2n,
          c: {
            d: hugeArray,
            e: '0x1234567890123456789012345678901234567890',
          },
        },
      ],
    )
  })

  bench('ethers - encoding dynamic tuple', () => {
    ethers.utils.defaultAbiCoder.encode(
      ['tuple(uint256[] a,uint256 b,tuple(uint256[] d,address e) c)'],
      [
        {
          a: hugeArray,
          b: 2n,
          c: {
            d: hugeArray,
            e: '0x1234567890123456789012345678901234567890',
          },
        },
      ],
    )
  })
})

describe('StructCodec - decoding', () => {
  const sink = new Sink(1)
  s.encode(sink, {
    a: hugeArray,
    b: 2n,
    c: {
      d: hugeArray,
      e: '0x1234567890123456789012345678901234567890',
    },
  })

  bench('decoding dynamic tuple', () => {
    s.decode(new Src(sink.result()))
  })

  bench('viem - decoding dynamic tuple', () => {
    decodeAbiParameters(
      [
        {
          type: 'tuple',
          components: [
            { name: 'a', type: 'uint256[]' },
            { name: 'b', type: 'uint256' },
            {
              name: 'c',
              type: 'tuple',
              components: [
                { name: 'd', type: 'uint256[]' },
                { name: 'e', type: 'address' },
              ],
            },
          ],
        },
      ],
      sink.result(),
    )
  })

  bench('ethers - decoding dynamic tuple', () => {
    ethers.utils.defaultAbiCoder.decode(['tuple(uint256[] a,uint256 b,tuple(uint256[] d,address e) c)'], sink.result())
  })
})
