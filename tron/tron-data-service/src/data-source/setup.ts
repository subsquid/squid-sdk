import {createLogger} from '@subsquid/logger'
import {HttpApi, TronHttpClient} from '@subsquid/tron-data'
import {Block, DataSource} from '@subsquid/util-internal-data-service'
import {TronDataSource} from './data-source'
import {Mapping} from './mapping'


const log = createLogger('sqd:tron-data-service/data-source')


export interface DataSourceOptions {
    httpApi: string
    httpApiStrideSize?: number
    httpApiStrideConcurrency?: number
    httpApiTimeout: number
    httpApiHeadPollInterval?: number
}


export function createDataSource(options: DataSourceOptions): DataSource<Block> {
    let client = new TronHttpClient({
        baseUrl: options.httpApi,
        httpTimeout: options.httpApiTimeout,
        retryAttempts: 5,
        log
    })

    let httpApi = new HttpApi(client)

    let dataSource = new TronDataSource({
        httpApi,
        strideSize: options.httpApiStrideSize,
        strideConcurrency: options.httpApiStrideConcurrency,
        headPollInterval: options.httpApiHeadPollInterval
    })

    return new Mapping(dataSource)
}
