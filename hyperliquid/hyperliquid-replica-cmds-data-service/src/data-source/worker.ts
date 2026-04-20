import {StreamRequest} from '@subsquid/util-internal-data-service'
import {getServer, getServerArguments} from '@subsquid/util-internal-worker-thread'
import {createDataSource} from './setup'


const source = createDataSource(getServerArguments())


getServer()
    .def('getFinalizedHead', () => source.getFinalizedHead())
    .def('getFinalizedStream', (req: StreamRequest) => {
        return source.getFinalizedStream(req)
    })
    .def('getHead', () => source.getHead())
    .def('getStream', (req: StreamRequest) => {
        return source.getStream(req)
    })
    .start()
