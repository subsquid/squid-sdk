import {getServerArguments} from '@subsquid/util-internal-worker-thread'
import {Mapping} from './mapping'
import {createDataSource, RawDataSourceOptions} from './raw-setup'
import {startServer} from './worker'

const options: RawDataSourceOptions = getServerArguments();

// plain RPC data source (no geyser)
const rpc = createDataSource({
    httpRpc: options.httpRpc,
    votes: options.votes
})

const mapping = new Mapping(rpc)

startServer(mapping)
