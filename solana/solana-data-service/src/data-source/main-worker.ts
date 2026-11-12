import {getServerArguments} from '@subsquid/util-internal-worker-thread'
import {createMainDataSource, DataSourceOptions} from './setup'
import {startServer} from './worker'

const options = getServerArguments<DataSourceOptions>()

const {source, getRpcMetrics} = createMainDataSource(options)

startServer(source, getRpcMetrics)
