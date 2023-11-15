import type {RpcClient} from '@subsquid/rpc-client'


export class Chain {
    constructor(
        private getRpc: () => RpcClient
    ) {}

    get rpc(): RpcClient {
        return this.getRpc()
    }
}
