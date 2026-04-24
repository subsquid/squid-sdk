export const WORD_SIZE = 32

export type BaseType = 'int' | 'address' | 'bool' | 'bytes' | 'string' | 'array' | 'struct'

/** ABI encoder backend — writes one 32-byte word per call, manages the head/tail structure. */
export interface Sink {
    u8(val: number): void
    i8(val: number): void
    u16(val: number): void
    i16(val: number): void
    u32(val: number): void
    i32(val: number): void
    u64(val: bigint): void
    i64(val: bigint): void
    u128(val: bigint): void
    i128(val: bigint): void
    u256(val: bigint): void
    i256(val: bigint): void
    bool(val: boolean): void
    bytes(val: Uint8Array | string): void
    staticBytes(len: number, val: Uint8Array | string): void
    address(val: string): void
    string(val: string): void
    /** Begin the tail of a dynamic type (writes the head offset, enters tail context). */
    openTail(slotsCount?: number): void
    /** Begin the tail of a dynamic array (writes offset + element count, enters tail context). */
    openArray(count: number): void
    /** End the current tail, propagate its size to the parent context. */
    closeTail(): void
    toString(): string
}

/** ABI decoder backend — reads one 32-byte word per call, follows offset pointers. */
export interface Src {
    u8(): number
    i8(): number
    u16(): number
    i16(): number
    u32(): number
    i32(): number
    u64(): bigint
    i64(): bigint
    u128(): bigint
    i128(): bigint
    u256(): bigint
    i256(): bigint
    bool(): boolean
    bytes(): Uint8Array
    /** Decode a dynamic `bytes` value as a `0x`-prefixed hex string. */
    bytesHex(): string
    staticBytes(len: number): Uint8Array
    /** Decode a `bytes<N>` value as a `0x`-prefixed hex string. */
    staticBytesHex(len: number): string
    address(): string
    string(): string
    /** Create a sub-view of this source starting at byte offset `start`. */
    slice(start: number, end?: number): Src
    /** Follow an offset pointer: save the current position and jump to `pos`. */
    jump(pos: number): void
    /** Return to the position saved by the last `jump`. */
    jumpBack(): void
}

export interface Codec<TIn, TOut = TIn> {
    encode(sink: Sink, val: TIn): void
    decode(src: Src): TOut
    isDynamic: boolean
    slotsCount?: number
    baseType: BaseType
}

export type Struct = {
    [key: string]: Codec<any>
}
