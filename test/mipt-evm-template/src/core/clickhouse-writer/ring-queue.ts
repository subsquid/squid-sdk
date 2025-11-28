import assert from 'node:assert'


export class RingQueue<T> {
    private buf: (T | undefined)[]
    private size = 0
    private pos = 0

    constructor(capacity: number) {
        assert(capacity > 0)
        this.buf = new Array(capacity)
    }

    push(val: T): void {
        if (this.size == this.buf.length) {
            this.enlargeBuffer()
        }
        this.buf[(this.pos + this.size) % this.buf.length] = val
        this.size += 1
    }

    shift(): T | undefined {
        if (this.size > 0) {
            let val = this.buf[this.pos]
            this.buf[this.pos] = undefined
            this.size -= 1
            this.pos = (this.pos + 1) % this.buf.length
            return val
        } else {
            return undefined
        }
    }

    get length(): number {
        return this.size
    }

    private enlargeBuffer(): void {
        assert(this.size > 0)
        assert.strictEqual(this.size, this.buf.length)
        let len = this.size * 2
        this.buf.length = len
        if (this.size > this.pos * 2) {
            for (let i = this.size - this.pos; i < this.size; i++) {
                let o = this.pos + i
                this.buf[o % len] = this.buf[o % this.size]
                this.buf[o % this.size] = undefined
            }
        } else {
            let newPos = this.pos + len - this.size
            for (let i = 0; i < this.size - this.pos; i++) {
                let s = this.pos + i
                this.buf[newPos + i] = this.buf[s]
                this.buf[s] = undefined
            }
            this.pos = newPos
        }
    }
}
