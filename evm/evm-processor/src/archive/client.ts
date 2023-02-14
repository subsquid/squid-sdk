import {HttpClient} from '@subsquid/util-internal-http-client'
import {BatchRequest, DataSource, BatchResponse} from '@subsquid/util-internal-processor-tools'
import {BlockData, DataRequest} from '../interfaces/data'


export class ArchiveDataSource implements DataSource<DataRequest, BlockData> {
    constructor(private http: HttpClient) {}

    async batchRequest(request: BatchRequest<DataRequest>): Promise<BatchResponse<BlockData>> {
        throw new Error()
    }

    async getChainHeight(): Promise<number> {
        let {height}: {height: number} = await this.http.get('/height')
        return height
    }
}
