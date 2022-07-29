import {Logger} from "@subsquid/logger"
import {assertNotNull, def} from "@subsquid/util-internal"
import {graphqlRequest} from "@subsquid/util-internal-gql-request"
import {ExploreApi} from "./explore"
import {SpecVersion, SpecVersionRecord} from "./specVersion"
import {withErrorContext} from "./util"


export class ArchiveApi implements ExploreApi {
    constructor(private url: string, private log?: Logger) {
    }

    getVersion(rec: SpecVersionRecord): Promise<SpecVersion> {
        return this.request<{metadataById: SpecVersion}>(`query {
            metadataById(id: "${rec.specName}@${rec.specVersion}") {
                specName
                specVersion
                blockNumber: blockHeight
                blockHash
                metadata: hex
            }
        }`).then(res => assertNotNull(res?.metadataById));
    }

    async getVersionRecord(blockNumber: number): Promise<SpecVersionRecord | undefined> {
        let versions = await this.versionRecords()
        return versions.find(v => v.blockNumber === blockNumber)
    }

    async getVersionRecords(fromBlock?: number): Promise<SpecVersionRecord[]> {
        let versions = await this.versionRecords()
        if (fromBlock) {
            versions = versions.filter(v => v.blockNumber >= fromBlock)
        }
        return versions
    }

    async getSingleVersionRecord(): Promise<SpecVersionRecord | undefined> {
        let versions = await this.versionRecords()
        if (versions.length == 1) return versions[0]
    }

    @def
    private versionRecords(): Promise<SpecVersionRecord[]> {
        return this.request<{metadata: SpecVersionRecord[]}>(`query {
            metadata {
                specName
                specVersion
                blockNumber: blockHeight
                blockHash
            }
        }`).then(res => res.metadata.sort((a, b) => a.blockNumber - b.blockNumber))
    }

    private request<T>(query: string): Promise<T> {
        return graphqlRequest<T>({
            headers: {
                'x-squid-id': 'metadata-explorer'
            },
            url: this.url,
            query,
            retry: {
                maxCount: 3,
                log: (err, errorsInRow, backoff) => {
                    this.log?.warn({
                        archiveQuery: this.url,
                        backoff,
                        reason: err.message
                    }, 'retry')
                }
            }
        }).catch(
            withErrorContext({
                archiveUrl: this.url,
                archiveQuery: query
            })
        )
    }

    fetchVersions(): Promise<SpecVersion[]> {
        return this.request<{metadata: SpecVersion[]}>(`query {
            metadata {
                specName
                specVersion
                blockNumber: blockHeight
                blockHash
                metadata: hex
            }
        }`).then(res => res.metadata.sort((a, b) => a.blockNumber - b.blockNumber))
    }
}
