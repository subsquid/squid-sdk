import {Block} from '@subsquid/util-internal-data-service'
import {createWorker} from '@subsquid/util-internal-worker-thread'
import {RawDataSourceOptions} from './raw-setup'
import {DataWorker} from './worker'


export interface DataSourceOptions extends RawDataSourceOptions {}


export class MainDataWorker extends DataWorker<Block> {
    constructor(options: DataSourceOptions) {
        super(createWorker({
            script: require.resolve('./main-worker'),
            args: options,
            name: 'mapping-worker'
        }))
    }
}
