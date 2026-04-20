import type {Block} from '@subsquid/util-internal-data-service'
import {createWorker} from '@subsquid/util-internal-worker-thread'
import type {DataSourceOptions} from './setup'
import {RemoteDataSource} from './worker'


export class SecondaryDataSource extends RemoteDataSource<Block> {
    constructor(options: DataSourceOptions) {
        super(createWorker({
            script: require.resolve('./secondary-worker'),
            args: options,
            name: 'secondary-data-source'
        }))
    }
}
