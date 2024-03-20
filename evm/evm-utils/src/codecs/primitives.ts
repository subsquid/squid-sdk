import { Codec } from "../codec";
import { Sink } from "../sink";
import { Src } from "../src";
import { ArrayCodec, FixedArrayCodec } from "./array";

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

export const string: Codec<string> = {
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

export const address: Codec<string> = {
  encode(sink: Sink, val: string) {
    sink.address(val);
  },
  decode(src: Src): string {
    return src.address();
  },
  isDynamic: false,
};

export const fixedArray = <T>(item: Codec<T>, size: number): Codec<T[]> =>
  new FixedArrayCodec(item, size);

export const array = <T>(item: Codec<T>): Codec<T[]> => new ArrayCodec(item);
