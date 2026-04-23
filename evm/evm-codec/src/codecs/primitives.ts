import { decodeHex, isHex, toHex } from '@subsquid/util-internal-hex'
import { Codec } from '../codec'
import { Sink } from '../sink'
import { Src } from '../src'
import { safeToNumber } from '../safeToNumber'

type Numberish = number | bigint

/**
 * Build a primitive numeric codec driven by a `Sink`/`Src` method name and a
 * value-conversion strategy.
 */
type NumericConv = 'safeToNumber' | 'BigInt' | 'none'

function numericCodec<TOut extends number | bigint>(method: string, conv: NumericConv): Codec<Numberish, TOut> {
  return {
    encode(sink: Sink, val: Numberish) {
      const v = conv === 'safeToNumber' ? safeToNumber(val) : conv === 'BigInt' ? BigInt(val) : val
      ;(sink as any)[method](v)
    },
    decode(src: Src): TOut {
      return (src as any)[method]()
    },
    isDynamic: false,
    baseType: 'int',
  }
}

export const bool: Codec<boolean> = {
  encode(sink: Sink, val: boolean) {
    sink.bool(val)
  },
  decode(src: Src): boolean {
    return src.bool()
  },
  isDynamic: false,
  baseType: 'bool',
}

export const uint8: Codec<Numberish, number> = numericCodec('u8', 'safeToNumber')
export const int8: Codec<Numberish, number> = numericCodec('i8', 'safeToNumber')
export const uint16: Codec<Numberish, number> = numericCodec('u16', 'safeToNumber')
export const int16: Codec<Numberish, number> = numericCodec('i16', 'safeToNumber')
export const uint32: Codec<Numberish, number> = numericCodec('u32', 'safeToNumber')
export const int32: Codec<Numberish, number> = numericCodec('i32', 'safeToNumber')
export const uint64: Codec<Numberish, bigint> = numericCodec('u64', 'BigInt')
export const int64: Codec<Numberish, bigint> = numericCodec('i64', 'BigInt')
export const uint128: Codec<Numberish, bigint> = numericCodec('u128', 'BigInt')
export const int128: Codec<Numberish, bigint> = numericCodec('i128', 'BigInt')
export const uint256: Codec<Numberish, bigint> = numericCodec('u256', 'BigInt')
export const int256: Codec<Numberish, bigint> = numericCodec('i256', 'BigInt')

export const string: Codec<string> = {
  encode(sink: Sink, val: string) {
    sink.newStaticDataArea()
    sink.string(val)
    sink.endCurrentDataArea()
  },
  decode(src: Src): string {
    return src.string()
  },
  isDynamic: true,
  baseType: 'string',
}

function toBytes(val: Uint8Array | string): Uint8Array {
  if (val instanceof Uint8Array) {
    return val
  }
  if (!isHex(val)) {
    throw new Error(`Expected hex string or Uint8Array, got: ${val}`)
  }
  return decodeHex(val)
}

export const bytes: Codec<Uint8Array | string, string> = {
  encode(sink: Sink, val: Uint8Array | string) {
    sink.newStaticDataArea()
    sink.bytes(toBytes(val))
    sink.endCurrentDataArea()
  },
  decode(src: Src): string {
    return toHex(src.bytes())
  },
  isDynamic: true,
  baseType: 'bytes',
}

const bytesN = (size: number): Codec<Uint8Array | string, string> => ({
  encode(sink: Sink, val: Uint8Array | string) {
    sink.staticBytes(size, toBytes(val))
  },
  decode(src: Src): string {
    return toHex(src.staticBytes(size))
  },
  isDynamic: false,
  baseType: 'bytes',
})

export const bytes0 = bytesN(0)
export const bytes1 = bytesN(1)
export const bytes2 = bytesN(2)
export const bytes3 = bytesN(3)
export const bytes4 = bytesN(4)
export const bytes5 = bytesN(5)
export const bytes6 = bytesN(6)
export const bytes7 = bytesN(7)
export const bytes8 = bytesN(8)
export const bytes9 = bytesN(9)
export const bytes10 = bytesN(10)
export const bytes11 = bytesN(11)
export const bytes12 = bytesN(12)
export const bytes13 = bytesN(13)
export const bytes14 = bytesN(14)
export const bytes15 = bytesN(15)
export const bytes16 = bytesN(16)
export const bytes17 = bytesN(17)
export const bytes18 = bytesN(18)
export const bytes19 = bytesN(19)
export const bytes20 = bytesN(20)
export const bytes21 = bytesN(21)
export const bytes22 = bytesN(22)
export const bytes23 = bytesN(23)
export const bytes24 = bytesN(24)
export const bytes25 = bytesN(25)
export const bytes26 = bytesN(26)
export const bytes27 = bytesN(27)
export const bytes28 = bytesN(28)
export const bytes29 = bytesN(29)
export const bytes30 = bytesN(30)
export const bytes31 = bytesN(31)
export const bytes32 = bytesN(32)

export const address: Codec<string> = {
  encode(sink: Sink, val: string) {
    sink.address(val)
  },
  decode(src: Src): string {
    return src.address()
  },
  isDynamic: false,
  baseType: 'address',
}

export const uint24 = uint32
export const int24 = int32
export const uint40 = uint64
export const int40 = int64
export const uint48 = uint64
export const int48 = int64
export const uint56 = uint64
export const int56 = int64
export const uint72 = uint128
export const int72 = int128
export const uint80 = uint128
export const int80 = int128
export const uint88 = uint128
export const int88 = int128
export const uint96 = uint128
export const int96 = int128
export const uint104 = uint128
export const int104 = int128
export const uint112 = uint128
export const int112 = int128
export const uint120 = uint128
export const int120 = int128
export const uint136 = uint256
export const int136 = int256
export const uint144 = uint256
export const int144 = int256
export const uint152 = uint256
export const int152 = int256
export const uint160 = uint256
export const int160 = int256
export const uint168 = uint256
export const int168 = int256
export const uint176 = uint256
export const int176 = int256
export const uint184 = uint256
export const int184 = int256
export const uint192 = uint256
export const int192 = int256
export const uint200 = uint256
export const int200 = int256
export const uint208 = uint256
export const int208 = int256
export const uint216 = uint256
export const int216 = int256
export const uint224 = uint256
export const int224 = int256
export const uint232 = uint256
export const int232 = int256
export const uint240 = uint256
export const int240 = int256
export const uint248 = uint256
export const int248 = int256
