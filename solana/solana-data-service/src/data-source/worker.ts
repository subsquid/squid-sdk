import {DataSourceStreamOptions} from '@subsquid/util-internal-data-service'
import {getServer, getServerArguments} from '@subsquid/util-internal-worker-thread'
import {createDataSource} from './setup'


const source = createDataSource(getServerArguments())


getServer()
    .def('getFinalizedHead', () => source.getFinalizedHead())
    .def('getFinalizedStream', (req: DataSourceStreamOptions) => {
        return source.getFinalizedStream(req)
    })
    .def('getStream', (req: DataSourceStreamOptions) => {
        return source.getStream(req)
    })
    .start()
