import {getServerArguments} from '@subsquid/util-internal-worker-thread'
import {Mapping} from './mapping'
import {createDataSource, RawDataSourceOptions} from './raw-setup'
import {startServer} from './worker'

const {
    geyserProxy,
    geyserBlockQueueSize,
    ...options
} = getServerArguments<RawDataSourceOptions>();

// plain RPC data source (no geyser)
const rpc = createDataSource(options)

const mapping = new Mapping(rpc)

startServer(mapping)
