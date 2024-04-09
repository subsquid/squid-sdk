import { Codec } from '../codec'
import { Sink } from '../sink'
import { Src } from '../src'
import { ArrayCodec, FixedSizeArrayCodec } from './array'
import { StructCodec } from './struct'
import assert from 'node:assert'

function safeSignedRangeCodec<T extends number | bigint | boolean | string>(
  min: bigint,
  max: bigint,
  typeName: string,
  converter: (val: bigint) => T,
): Codec<T> {
  return {
    isDynamic: false,
    encode(sink: Sink, val: T) {
      const bigVal = BigInt(val)
      assert(bigVal >= min, `${bigVal} underflows for ${typeName}`)
      assert(bigVal <= max, `${bigVal} overflows for ${typeName}`)
      sink.i256(bigVal)
    },
    decode(src: Src): T {
      const val = src.i256()
      assert(val >= min, `${val} underflows for ${typeName}`)
      assert(val <= max, `${val} overflows for ${typeName}`)
      return converter(val)
    },
  }
}

function safeUnsignedRangeCodec<T extends number | bigint | boolean | string>(
  max: bigint,
  typeName: string,
  converter: (val: bigint) => T,
): Codec<T> {
  return {
    isDynamic: false,
    encode(sink: Sink, val: T) {
      const bigVal = BigInt(val)
      assert(bigVal >= 0, `Negative ${bigVal} provided for ${typeName}`)
      assert(bigVal <= max, `${bigVal} overflows for ${typeName}`)
      sink.u256(bigVal)
    },
    decode(src: Src): T {
      const val = src.u256()
      assert(val <= max, `${val} overflows for ${typeName}`)
      return converter(val)
    },
  }
}

const uintCodec = (bits: number) => safeUnsignedRangeCodec((1n << BigInt(bits)) - 1n, `uint${bits}`, Number)
const intCodec = (bits: number) =>
  safeSignedRangeCodec(-(1n << BigInt(bits - 1)), (1n << BigInt(bits - 1)) - 1n, `int${bits}`, Number)

const bigUintCodec = (bits: number) => safeUnsignedRangeCodec((1n << BigInt(bits)) - 1n, `uint${bits}`, BigInt)
const bigIntCodec = (bits: number) =>
  safeSignedRangeCodec(-(1n << BigInt(bits - 1)), (1n << BigInt(bits - 1)) - 1n, `int${bits}`, BigInt)

export const bool = safeUnsignedRangeCodec(1n, 'bool', (val) => val === 1n)

export const uint8 = uintCodec(8)
export const int8 = intCodec(8)
export const uint16 = uintCodec(16)
export const int16 = intCodec(16)
export const uint32 = uintCodec(32)
export const int32 = intCodec(32)
export const uint64 = bigUintCodec(64)
export const int64 = bigIntCodec(64)
export const uint128 = bigUintCodec(128)
export const int128 = bigIntCodec(128)
export const uint256 = bigUintCodec(256)
export const int256 = bigIntCodec(256)

export const string = <const>{
  encode(sink: Sink, val: string) {
    sink.newStaticDataArea()
    sink.string(val)
    sink.endCurrentDataArea()
  },
  decode(src: Src): string {
    return src.string()
  },
  isDynamic: true,
}

export const address = safeUnsignedRangeCodec(
  2n ** 160n - 1n,
  'address',
  (val) => `0x${val.toString(16).padStart(40, '0')}`,
)

export const bytes = <const>{
  encode(sink: Sink, val: Uint8Array) {
    sink.newStaticDataArea()
    sink.bytes(val)
    sink.endCurrentDataArea()
  },
  decode(src: Src): Uint8Array {
    return src.bytes()
  },
  isDynamic: true,
}

const bytesN = (len: number): Codec<Uint8Array> => ({
  encode(sink: Sink, val: Uint8Array) {
    const size = Buffer.byteLength(val)
    if (size > len) {
      throw new Error(`invalid data size for bytes${len}`)
    }
    sink.staticBytes(val)
  },
  decode(src: Src): Uint8Array {
    const val = src.staticBytes()
    assert(
      val.slice(len).every((byte) => byte === 0),
      `nonzero padding for bytes${len}`,
    )
    return val.slice(0, len)
  },
  isDynamic: false,
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

export const fixedSizeArray = <T>(item: Codec<T>, size: number): Codec<T[]> => new FixedSizeArrayCodec(item, size)

export const array = <T>(item: Codec<T>): Codec<T[]> => new ArrayCodec(item)

type Struct = {
  [key: string]: Codec<any>
}

export const struct = <const T extends Struct>(components: T) => new StructCodec<T>(components)

export const tuple = struct

export const uint24 = uintCodec(24)
export const int24 = intCodec(24)
export const uint40 = uintCodec(40)
export const int40 = intCodec(40)
export const uint48 = uintCodec(48)
export const int48 = intCodec(48)

export const uint56 = bigUintCodec(56)
export const int56 = bigIntCodec(56)
export const uint72 = bigUintCodec(72)
export const int72 = bigIntCodec(72)
export const uint80 = bigUintCodec(80)
export const int80 = bigIntCodec(80)
export const uint88 = bigUintCodec(88)
export const int88 = bigIntCodec(88)
export const uint96 = bigUintCodec(96)
export const int96 = bigIntCodec(96)
export const uint104 = bigUintCodec(104)
export const int104 = bigIntCodec(104)
export const uint112 = bigUintCodec(112)
export const int112 = bigIntCodec(112)
export const uint120 = bigUintCodec(120)
export const int120 = bigIntCodec(120)
export const uint136 = bigUintCodec(136)
export const int136 = bigIntCodec(136)
export const uint144 = bigUintCodec(144)
export const int144 = bigIntCodec(144)
export const uint152 = bigUintCodec(152)
export const int152 = bigIntCodec(152)
export const uint160 = bigUintCodec(160)
export const int160 = bigIntCodec(160)
export const uint168 = bigUintCodec(168)
export const int168 = bigIntCodec(168)
export const uint176 = bigUintCodec(176)
export const int176 = bigIntCodec(176)
export const uint184 = bigUintCodec(184)
export const int184 = bigIntCodec(184)
export const uint192 = bigUintCodec(192)
export const int192 = bigIntCodec(192)
export const uint200 = bigUintCodec(200)
export const int200 = bigIntCodec(200)
export const uint208 = bigUintCodec(208)
export const int208 = bigIntCodec(208)
export const uint216 = bigUintCodec(216)
export const int216 = bigIntCodec(216)
export const uint224 = bigUintCodec(224)
export const int224 = bigIntCodec(224)
export const uint232 = bigUintCodec(232)
export const int232 = bigIntCodec(232)
export const uint240 = bigUintCodec(240)
export const int240 = bigIntCodec(240)
export const uint248 = bigUintCodec(248)
export const int248 = bigIntCodec(248)
