import {HttpClient, RequestOptions, HttpBody} from '@subsquid/http-client'
import {Block, TransactionInfo} from './interfaces'


export class HttpApi {
    constructor(
        private readonly http: HttpClient,
        private readonly options: RequestOptions = {}
    ) {}

    async getBlock(num: number, detail: boolean): Promise<Block> {
        return this.post('wallet/getblock', {
            json: {
                id_or_num: String(num),
                detail
            }
        })
    }

    async getTransactionInfo(num: number): Promise<TransactionInfo[]> {
        return this.post('wallet/gettransactioninfobyblocknum', {
            json: { num }
        })
    }

    async getNowBlock(): Promise<Block> {
        return this.post('wallet/getnowblock')
    }

    async post<T=any>(url: string, body?: HttpBody): Promise<T> {
        return this.http.post(url, {
            ...this.options,
            ...body,
        })
    }
}
