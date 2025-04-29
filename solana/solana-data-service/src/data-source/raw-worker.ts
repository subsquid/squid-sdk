import {getServerArguments} from '@subsquid/util-internal-worker-thread'
import {createDataSource} from './raw-setup'
import {startServer} from './worker'


const source = createDataSource(getServerArguments())

startServer(source)
