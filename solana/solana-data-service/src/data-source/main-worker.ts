import {getServerArguments} from '@subsquid/util-internal-worker-thread'
import {Mapping} from './mapping'
import {RawDataWorker} from './raw-client'
import {RawDataSourceOptions} from './raw-setup'
import {startServer} from './worker'

const dataOptions: RawDataSourceOptions = getServerArguments()

const upstream = new RawDataWorker(dataOptions)

const mapping = new Mapping(upstream)

startServer(mapping)
