import {Block} from '@subsquid/solana-rpc'
import {createWorker} from '@subsquid/util-internal-worker-thread'
import {RawDataSourceOptions} from './raw-setup'
import {DataWorker} from './worker'


export class RawDataWorker extends DataWorker<Block> {
    constructor(options: RawDataSourceOptions) {
        super(createWorker({
            script: require.resolve('./raw-worker'),
            args: options,
            name: 'raw-data-worker'
        }))
    }
}
