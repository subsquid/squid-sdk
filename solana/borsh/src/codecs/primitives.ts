import base58 from 'bs58'
import {Codec} from '../codec'
import {Sink} from '../sink'
import {Src} from '../src'
import {Base58Bytes} from '../type-util'
import assert from 'assert'


export const unit: Codec<undefined> = {
    decode(src: Src): undefined {
        return undefined
    },
    encode(sink: Sink, val: undefined): void {}
}


export const bool: Codec<boolean> = {
    encode(sink: Sink, val: boolean): void {
        sink.bool(val)
    },
    decode(src: Src): boolean {
        return src.bool()
    }
}


export const f32: Codec<number> = {
    encode(sink: Sink, val: number): void {
        sink.f32(val)
    },
    decode(src: Src): number {
        return src.f32()
    }
}


export const f64: Codec<number> = {
    encode(sink: Sink, val: number): void {
        sink.f64(val)
    },
    decode(src: Src): number {
        return src.f64()
    }
}


export const u8: Codec<number> = {
    encode(sink: Sink, val: number): void {
        sink.u8(val)
    },
    decode(src: Src): number {
        return src.u8()
    }
}


export const i8: Codec<number> = {
    encode(sink: Sink, val: number): void {
        sink.i8(val)
    },
    decode(src: Src): number {
        return src.i8()
    }
}


export const u16: Codec<number> = {
    encode(sink: Sink, val: number): void {
        sink.u16(val)
    },
    decode(src: Src): number {
        return src.u16()
    }
}


export const i16: Codec<number> = {
    encode(sink: Sink, val: number): void {
        sink.i16(val)
    },
    decode(src: Src): number {
        return src.i16()
    }
}


export const u32: Codec<number> = {
    encode(sink: Sink, val: number): void {
        sink.u32(val)
    },
    decode(src: Src): number {
        return src.u32()
    }
}


export const i32: Codec<number> = {
    encode(sink: Sink, val: number): void {
        sink.i32(val)
    },
    decode(src: Src): number {
        return src.i32()
    }
}


export const u64: Codec<bigint> = {
    encode(sink: Sink, val: bigint): void {
        sink.u64(val)
    },
    decode(src: Src): bigint {
        return src.u64()
    }
}


export const i64: Codec<bigint> = {
    encode(sink: Sink, val: bigint): void {
        sink.i64(val)
    },
    decode(src: Src): bigint {
        return src.i64()
    }
}


export const u128: Codec<bigint> = {
    encode(sink: Sink, val: bigint): void {
        sink.u128(val)
    },
    decode(src: Src): bigint {
        return src.u128()
    }
}


export const i128: Codec<bigint> = {
    encode(sink: Sink, val: bigint): void {
        sink.i128(val)
    },
    decode(src: Src): bigint {
        return src.i128()
    }
}


export const binary: Codec<Uint8Array> = {
    encode(sink: Sink, val: Uint8Array): void {
        sink.u32(val.length)
        sink.bytes(val)
    },
    decode(src: Src): Uint8Array {
        let len = src.u32()
        return src.bytes(len)
    }
}


export const string: Codec<string> = {
    encode(sink: Sink, val: string): void {
        sink.string(val)
    },
    decode(src: Src): string {
        return src.string()
    }
}


export const address: Codec<Base58Bytes> = {
    encode(sink: Sink, val: Base58Bytes): void {
        let bytes = base58.decode(val)
        assert(bytes.length == 32)
        sink.bytes(bytes)
    },
    decode(src: Src): Base58Bytes {
        return src.base58(32)
    }
}
