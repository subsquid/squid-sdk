import {XXHash} from "./interface"


export class XXHash128 implements XXHash {
    private h0: XXHash
    private h1: XXHash

    constructor(h64: (seed: number) => XXHash) {
        this.h0 = h64(0)
        this.h1 = h64(1)
    }

    update(data: string | Uint8Array): this {
        this.h0.update(data)
        this.h1.update(data)
        return this
    }

    digest(): bigint {
        let d1 = this.h0.digest()
        let d2 = this.h1.digest()
        return d1 + (d2 << 64n)
    }
}


export class XXHash256 implements XXHash {
    private h0: XXHash
    private h1: XXHash
    private h2: XXHash
    private h3: XXHash

    constructor(h64: (seed: number) => XXHash) {
        this.h0 = h64(0)
        this.h1 = h64(1)
        this.h2 = h64(2)
        this.h3 = h64(3)
    }

    update(data: string | Uint8Array): this {
        this.h0.update(data)
        this.h1.update(data)
        this.h2.update(data)
        this.h3.update(data)
        return this
    }

    digest(): bigint {
        let d0 = this.h0.digest()
        let d1 = this.h1.digest()
        let d2 = this.h2.digest()
        let d3 = this.h3.digest()
        return d0 + (d1 << 64n) + (d2 << 128n) + (d3 << 192n)
    }
}
