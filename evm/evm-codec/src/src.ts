import { WORD_SIZE } from "./codec";

export class Src {
    private view: DataView;
    private pos = 0;
    private oldPos = 0;
    constructor(private buf: Uint8Array) {
        this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    }

    setPosition(pos: number) {
        this.pos = pos
    }

    slice(start: number, end?: number): Src {
        return new Src(this.buf.subarray(start, end));
    }

    u8(): number {
        this.pos += WORD_SIZE - 1;
        let val = this.view.getUint8(this.pos);
        this.pos += 1;
        return val;
    }

    i8(): number {
        return Number(this.i256());
    }

    u16(): number {
        this.pos += WORD_SIZE - 2;
        let val = this.view.getUint16(this.pos, false);
        this.pos += 2;
        return val;
    }

    i16(): number {
        return Number(this.i256());
    }

    u32(): number {
        this.pos += WORD_SIZE - 4;
        let val = this.view.getUint32(this.pos, false);
        this.pos += 4;
        return val;
    }

    i32(): number {
        return Number(this.i256());
    }

    u64(): bigint {
        this.pos += WORD_SIZE - 8;
        return this.#u64();
    }

    #u64(): bigint {
        let val = this.view.getBigUint64(this.pos, false);
        this.pos += 8;
        return val;
    }

    i64(): bigint {
        this.pos += WORD_SIZE - 8;
        return this.#i64();
    }

    #i64(): bigint {
        let val = this.view.getBigInt64(this.pos, false);
        this.pos += 8;
        return val;
    }

    u128(): bigint {
        this.pos += WORD_SIZE - 16;
        return this.#u128();
    }

    #u128(): bigint {
        let hi = this.#u64();
        let lo = this.#u64();
        return lo + (hi << 64n);
    }

    i128(): bigint {
        this.pos += WORD_SIZE - 16;
        return this.#i128();
    }

    #i128(): bigint {
        let hi = this.#i64();
        let lo = this.#u64();
        return lo + (hi << 64n);
    }

    u256(): bigint {
        let hi = this.#u128();
        let lo = this.#u128();
        return lo + (hi << 128n);
    }

    i256(): bigint {
        let hi = this.#i128();
        let lo = this.#u128();
        return lo + (hi << 128n);
    }

    address(): string {
        return "0x" + this.u256().toString(16).padStart(40, "0");
    }

    bytes(): Uint8Array {
        const ptr = this.u32();
        this.safeJump(ptr);
        const len = this.u32();
        this.assertLength(len);
        const val = this.buf.subarray(this.pos, this.pos + len);
        this.jumpBack();
        return val;
    }

    staticBytes(len: number): Uint8Array {
        if (len > 32) {
            throw new Error(`bytes${len} is not a valid type`);
        }
        const val = this.buf.subarray(this.pos, this.pos + len);
        this.pos += WORD_SIZE;
        return val;
    }

    string(): string {
        const ptr = this.u32();
        this.safeJump(ptr);
        const len = this.u32();
        this.assertLength(len);
        const val = Buffer.from(
            this.buf.buffer,
            this.buf.byteOffset + this.pos,
            len
        ).toString("utf-8");
        this.jumpBack();
        return val;
    }

    bool(): boolean {
        return !!this.u8();
    }

    private assertLength(len: number): void {
        if (this.buf.length - this.pos < len) {
            throw new RangeError("Unexpected end of input");
        }
    }

    public safeJump(pos: number): void {
        if (pos < 0 || pos >= this.buf.length) {
            throw new RangeError(
                `Unexpected pointer location: 0x${pos.toString(16)}`
            );
        }
        this.oldPos = this.pos;
        this.pos = pos;
    }

    public jumpBack(): void {
        this.pos = this.oldPos;
    }
}
