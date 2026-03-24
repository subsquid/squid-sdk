import {getServerArguments} from '@subsquid/util-internal-worker-thread'
import {createSecondaryDataSource, DataSourceOptions} from './setup'
import {startServer} from './worker'

const options = getServerArguments<DataSourceOptions>();
const source = createSecondaryDataSource(options)

startServer(source)
