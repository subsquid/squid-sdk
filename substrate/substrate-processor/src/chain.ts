import type {RpcClient} from '@subsquid/rpc-client'
import type {Runtime} from '@subsquid/substrate-data'
import type {FiniteRange} from '@subsquid/util-internal-processor-tools'


export class Chain {
    constructor(
        private getRpc: () => RpcClient,
        private blockRange: FiniteRange,
        public readonly runtime: Runtime,
        private prevRuntime?: Runtime
    ) {}

    at(height: number): Chain {
        if (this.blockRange.from <= height && height <= this.blockRange.to) {
            return this
        } else if (this.prevRuntime && height + 1 == this.blockRange.from) {
            return new Chain(this.getRpc, {from: height, to: height}, this.prevRuntime)
        } else {
            throw new Error(`Runtime from block ${height} is not available`)
        }
    }

    get rpc(): RpcClient {
        return this.getRpc()
    }
}
