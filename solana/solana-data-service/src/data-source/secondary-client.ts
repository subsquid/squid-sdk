import {Block} from '@subsquid/util-internal-data-service'
import {createWorker} from '@subsquid/util-internal-worker-thread'
import type {RawDataSourceOptions} from './raw-setup'
import {DataWorker} from './worker'


export class SecondaryDataWorker extends DataWorker<Block> {
    constructor(options: RawDataSourceOptions) {
        super(createWorker({
            script: require.resolve('./secondary-worker'),
            args: options,
            name: 'secondary-data-worker'
        }))
    }
}
