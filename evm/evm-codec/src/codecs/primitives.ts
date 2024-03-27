import { Codec } from "../codec";
import { Sink } from "../sink";
import { Src } from "../src";
import { ArrayCodec, FixedArrayCodec } from "./array";
import { StructCodec } from "./struct";
import { AbiFunction } from "../abi-components/function";
import { AbiEvent } from "../abi-components/event";
import { Hex } from "../utils";

export const bool: Codec<boolean> = {
  encode: function (sink: Sink, val: boolean) {
    sink.bool(val);
  },
  decode(src: Src): boolean {
    return src.bool();
  },
  isDynamic: false,
};

export const uint8: Codec<number> = {
  encode(sink: Sink, val: number) {
    sink.u8(val);
  },
  decode(src: Src): number {
    return src.u8();
  },
  isDynamic: false,
};

export const int8: Codec<number> = {
  encode(sink: Sink, val: number) {
    sink.i8(val);
  },
  decode(src: Src): number {
    return src.i8();
  },
  isDynamic: false,
};

export const uint16: Codec<number> = {
  encode(sink: Sink, val: number) {
    sink.u16(val);
  },
  decode(src: Src): number {
    return src.u16();
  },
  isDynamic: false,
};

export const int16: Codec<number> = {
  encode(sink: Sink, val: number) {
    sink.i16(val);
  },
  decode(src: Src): number {
    return src.i16();
  },
  isDynamic: false,
};

export const uint32: Codec<number> = {
  encode(sink: Sink, val: number) {
    sink.u32(val);
  },
  decode(src: Src): number {
    return src.u32();
  },
  isDynamic: false,
};

export const int32: Codec<number> = {
  encode(sink: Sink, val: number) {
    sink.i32(val);
  },
  decode(src: Src): number {
    return src.i32();
  },
  isDynamic: false,
};

export const uint64: Codec<bigint> = {
  encode(sink: Sink, val: bigint) {
    sink.u64(val);
  },
  decode(src: Src): bigint {
    return src.u64();
  },
  isDynamic: false,
};

export const int64: Codec<bigint> = {
  encode(sink: Sink, val: bigint) {
    sink.i64(val);
  },
  decode(src: Src): bigint {
    return src.i64();
  },
  isDynamic: false,
};

export const uint128: Codec<bigint> = {
  encode(sink: Sink, val: bigint) {
    sink.u128(val);
  },
  decode(src: Src): bigint {
    return src.u128();
  },
  isDynamic: false,
};

export const int128: Codec<bigint> = {
  encode(sink: Sink, val: bigint) {
    sink.i128(val);
  },
  decode(src: Src): bigint {
    return src.i128();
  },
  isDynamic: false,
};

export const uint256: Codec<bigint> = {
  encode(sink: Sink, val: bigint) {
    sink.u256(val);
  },
  decode(src: Src): bigint {
    return src.u256();
  },
  isDynamic: false,
};

export const int256: Codec<bigint> = {
  encode(sink: Sink, val: bigint) {
    sink.i256(val);
  },
  decode(src: Src): bigint {
    return src.i256();
  },
  isDynamic: false,
};

export const string = <const>{
  encode(sink: Sink, val: string) {
    sink.offset();
    sink.string(val);
    sink.jumpBack();
  },
  decode(src: Src): string {
    return src.string();
  },
  isDynamic: true,
};

export const bytes: Codec<Uint8Array | Hex, Hex> = <const>{
  encode(sink: Sink, val: Uint8Array | Hex) {
    sink.offset();
    sink.bytes(val);
    sink.jumpBack();
  },
  decode(src: Src): Hex {
    return src.bytes();
  },
  isDynamic: true,
};

const bytesN = (size: number): Codec<Uint8Array | Hex, Hex> => ({
  encode(sink: Sink, val: Uint8Array | Hex) {
    sink.staticBytes(size, val);
  },
  decode(src: Src): Hex {
    return src.staticBytes(size);
  },
  isDynamic: false,
});

export const bytes0 = bytesN(0);
export const bytes1 = bytesN(1);
export const bytes2 = bytesN(2);
export const bytes3 = bytesN(3);
export const bytes4 = bytesN(4);
export const bytes5 = bytesN(5);
export const bytes6 = bytesN(6);
export const bytes7 = bytesN(7);
export const bytes8 = bytesN(8);
export const bytes9 = bytesN(9);
export const bytes10 = bytesN(10);
export const bytes11 = bytesN(11);
export const bytes12 = bytesN(12);
export const bytes13 = bytesN(13);
export const bytes14 = bytesN(14);
export const bytes15 = bytesN(15);
export const bytes16 = bytesN(16);
export const bytes17 = bytesN(17);
export const bytes18 = bytesN(18);
export const bytes19 = bytesN(19);
export const bytes20 = bytesN(20);
export const bytes21 = bytesN(21);
export const bytes22 = bytesN(22);
export const bytes23 = bytesN(23);
export const bytes24 = bytesN(24);
export const bytes25 = bytesN(25);
export const bytes26 = bytesN(26);
export const bytes27 = bytesN(27);
export const bytes28 = bytesN(28);
export const bytes29 = bytesN(29);
export const bytes30 = bytesN(30);
export const bytes31 = bytesN(31);
export const bytes32 = bytesN(32);

export const address: Codec<Hex> = {
  encode(sink: Sink, val: Hex) {
    sink.address(val);
  },
  decode(src: Src): Hex {
    return src.address();
  },
  isDynamic: false,
};

export const fixedArray = <T>(item: Codec<T>, size: number): Codec<T[]> =>
  new FixedArrayCodec(item, size);

export const array = <T>(item: Codec<T>): Codec<T[]> => new ArrayCodec(item);

type Struct = {
  [key: string]: Codec<any>;
};

export const struct = <const T extends Struct>(components: T) =>
  new StructCodec<T>(components);

export const tuple = struct;

export const fun = <
  const T extends Struct,
  const R extends Codec<any> | Struct | undefined
>(
  signature: string,
  args: T,
  returnType?: R
) => new AbiFunction<T, R>(signature, args, returnType);

export const event = <const T extends Struct>(topic: string, args: T) =>
  new AbiEvent<T>(topic, args);

export { indexed } from "../utils";
