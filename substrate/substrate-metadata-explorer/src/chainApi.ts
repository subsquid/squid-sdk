import {Logger} from "@subsquid/logger"
import {RpcClient} from '@subsquid/util-internal-resilient-rpc'
import {findSpecVersions} from "./binarySearch"
import {ExploreApi} from "./explore"
import {SpecVersion, SpecVersionRecord} from "./specVersion"


export class ChainApi implements ExploreApi {
    constructor(private client: RpcClient, private log?: Logger) {}

    async getHeight(): Promise<number> {
        let head = await this.client.call('chain_getFinalizedHead')
        let header = await this.client.call('chain_getHeader', [head])
        return parseInt(header.number)
    }

    async getVersionRecord(height: number): Promise<SpecVersionRecord> {
        let blockHash = await this.client.call('chain_getBlockHash', [height])
        let rt = await this.client.call('chain_getRuntimeVersion', [blockHash])
        return {
            specName: rt.specName,
            specVersion: rt.specVersion,
            blockNumber: height,
            blockHash
        }
    }

    async getVersionRecords(fromBlock?: number): Promise<SpecVersionRecord[]> {
        let firstBlock = fromBlock || 0
        let lastBlock = await this.getHeight()
        return findSpecVersions({
            firstBlock,
            lastBlock,
            fetch: this.getVersionRecordArray.bind(this),
            progress: info => {
                if (firstBlock > 0) {
                    this.log?.info(`step: ${info.step}, ${info.versions-1} new version${info.versions-1 == 1 ? '' : 's'} found so far`)
                } else {
                    this.log?.info(`step: ${info.step}, ${info.versions} version${info.versions == 1 ? '' : 's'} found so far`)
                }
            }
        })
    }

    getVersionRecordArray(heights: number[]): Promise<SpecVersionRecord[]> {
        return Promise.all(
            heights.map(h => this.getVersionRecord(h))
        )
    }

    async getVersion(rec: SpecVersionRecord): Promise<SpecVersion> {
        let metadata: string = await this.client.call('state_getMetadata', [rec.blockHash])
        return {...rec, metadata}
    }

    async getSingleVersionRecord(): Promise<SpecVersionRecord | undefined> {
        let genesis = await this.getVersionRecord(0)
        let height = await this.getHeight()
        let last = await this.getVersionRecord(height)
        if (genesis.specName == last.specName && genesis.specVersion == last.specVersion) {
            return genesis
        }
    }
}
