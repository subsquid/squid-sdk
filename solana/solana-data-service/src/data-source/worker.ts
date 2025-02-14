import {Block, BlockBatch, BlockStream, StreamRequest} from '@subsquid/util-internal-data-service'
import {getServer, getServerArguments, Transfer} from '@subsquid/util-internal-worker-thread'
import {createDataSource} from './setup'


const source = createDataSource(getServerArguments())


getServer()
    .def('getFinalizedHead', () => source.getFinalizedHead())
    .def('getFinalizedStream', (req: StreamRequest) => {
        return transfer(source.getFinalizedStream(req))
    })
    .def('getStream', (req: StreamRequest) => {
        return transfer(source.getStream(req))
    })
    .start()


async function* transfer(stream: BlockStream<Block>): AsyncIterable<Transfer<BlockBatch<Block>>> {
    for await (let batch of stream) {
        let transferList = batch.blocks.map(b => b.jsonLineGzip.buffer)
        yield new Transfer(batch, transferList)
    }
}
