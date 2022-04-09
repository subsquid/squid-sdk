import {assertNotNull} from "@subsquid/util-internal"
import {graphqlRequest} from "@subsquid/util-internal-gql-request"
import {Chain} from "./chain"
import {SpecVersion} from "./types"


export class Archive {
    constructor(private url: string, private chain: Chain) {}

    async getHeight(): Promise<number> {
        let response: {indexerStatus: {head: number}} = await this.request(`
            query {
                indexerStatus {
                    head
                }
            }
        `)
        return response.indexerStatus.head
    }

    async getSpecVersions(heights: number[]): Promise<SpecVersion[]> {
        let response: {versions: SpecVersion[]} = await this.request(`
            query {
                versions: substrate_block(where: {height: {_in: [${heights.join(', ')}]}}) {
                    specName: runtimeVersion(path: "$.specName") 
                    specVersion: runtimeVersion(path: "$.specVersion") 
                    blockNumber: height 
                    blockHash: hash
                }
             }
        `)

        let map = new Map(response.versions.map(v => [v.blockNumber, v]))
        if (map.size != heights.length) {
            // Workaround for some indexers, which don't start from block 0 for historical reasons
            let missing = heights.filter(h => !map.has(h))
            let missingVersions = await this.chain.getSpecVersions(missing)
            missingVersions.forEach(v => {
                map.set(v.blockNumber, v)
            })
        }

        return heights.map(h => {
            return assertNotNull(map.get(h))
        })
    }

    private request<T=any>(query: string): Promise<T> {
        return graphqlRequest({
            url: this.url,
            query
        })
    }
}
