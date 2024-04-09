import type {RpcClient} from '@subsquid/rpc-client'


export class Chain {
    constructor(
        private getRpc: () => RpcClient
    ) {}

    get rpc(): RpcClient {
        return this.getRpc()
    }

    /**
     * Same as {@link .rpc}
     *
     * @deprecated Use {@link .rpc} instead
     */
    get client(): RpcClient {
        return this.getRpc()
    }
}
