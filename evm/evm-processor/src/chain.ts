import {RpcClient} from './util/rpc'

export class Chain {
    constructor(private getClient: () => RpcClient) {}

    get client(): RpcClient {
        return this.getClient()
    }
}
