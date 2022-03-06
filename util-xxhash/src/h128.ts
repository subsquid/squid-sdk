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
