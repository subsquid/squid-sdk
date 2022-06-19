import {h64, HashObject as HashImpl} from "xxhashjs"
import {XXHash} from "./interface"


export class XXHashJs64 implements XXHash {
    private hash: HashImpl

    constructor(seed?: number) {
        this.hash = h64(seed)
    }

    update(data: string | Uint8Array): this {
        this.hash.update(data)
        return this
    }

    digest(): bigint {
        return BigInt(this.hash.digest().toString())
    }
}


