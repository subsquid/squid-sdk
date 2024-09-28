import {HttpClient, RequestOptions, HttpBody} from '@subsquid/http-client'
import {DataValidationError, GetSrcType, Validator, array} from '@subsquid/util-internal-validation'
import {Block, TransactionInfo} from './data'


function getResultValidator<V extends Validator>(validator: V): (result: unknown) => GetSrcType<V> {
    return function(result: unknown) {
        let err = validator.validate(result)
        if (err) {
            throw new DataValidationError(`server returned unexpected result: ${err.toString()}`)
        } else {
            return result as any
        }
    }
}


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
        }, getResultValidator(Block))
    }

    async getTransactionInfo(num: number): Promise<TransactionInfo[]> {
        return this.post('wallet/gettransactioninfobyblocknum', {
            json: { num }
        }, getResultValidator(array(TransactionInfo)))
    }

    async getNowBlock(): Promise<Block> {
        return this.post('wallet/getnowblock', undefined, getResultValidator(Block))
    }

    async post<T=any>(url: string, body?: HttpBody, validateResult?: (result: unknown) => T): Promise<T> {
        return this.http.post(url, {
            ...this.options,
            ...body,
        }).then(res => validateResult ? validateResult(res) : res)
    }
}
