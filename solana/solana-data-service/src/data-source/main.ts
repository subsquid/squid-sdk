import type {Block} from '@subsquid/util-internal-data-service'
import {createWorker} from '@subsquid/util-internal-worker-thread'
import type {DataSourceOptions} from './setup'
import {RemoteDataSource} from './worker'


export class MainDataSource extends RemoteDataSource<Block> {
    constructor(options: DataSourceOptions) {
        super(createWorker({
            script: require.resolve('./main-worker'),
            args: options,
            name: 'main-data-source'
        }))
    }
}
