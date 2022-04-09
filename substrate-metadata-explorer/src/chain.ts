import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {SpecVersion} from "./types"


export class Chain {
    constructor(private client: ResilientRpcClient) {}

    async getHeight(): Promise<number> {
        let head = await this.client.call('chain_getFinalizedHead')
        let header = await this.client.call('chain_getHeader', [head])
        return parseInt(header.number)
    }

    async getSpecVersion(height: number): Promise<SpecVersion> {
        let blockHash = await this.client.call('chain_getBlockHash', [height])
        let rt = await this.client.call('chain_getRuntimeVersion', [blockHash])
        return {
            specName: rt.specName,
            specVersion: rt.specVersion,
            blockNumber: height,
            blockHash
        }
    }

    async getSpecVersions(heights: number[]): Promise<SpecVersion[]> {
        let result: SpecVersion[] = new Array(heights.length)
        for (let i = 0; i < heights.length; i++) {
            result[i] = await this.getSpecVersion(heights[i])
        }
        return result
    }

    getMetadata(blockHash: string): Promise<string> {
        return this.client.call('state_getMetadata', [blockHash])
    }
}
