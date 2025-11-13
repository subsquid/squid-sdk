import {createLogger} from '@subsquid/logger'
import {createQueryStream, DataBatch} from '@subsquid/portal-tools'
import {last, runProgram} from '@subsquid/util-internal'
import {PortalClient} from './core/portal-client'


const log = createLogger('main')


runProgram(async () => {
    let portal = new PortalClient('https://portal.sqd.dev/datasets/ethereum-mainnet/stream')

    let stream = createQueryStream(portal, {
        type: 'evm',
        fromBlock: 23600000,
        fields: {
            transaction: {
                transactionIndex: true,
                hash: true,
                from: true
            },
            log: {
                logIndex: true,
                transactionIndex: true,
                address: true,
                topics: true,
                data: true
            }
        },
        logs: [
            {
                address: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
                topic0: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
                transaction: true
            }
        ]
    })

    for await (let batch of stream) {
        printBatchStats(batch)
    }
}, err => log.fatal(err))


function printBatchStats(batch: DataBatch): void {
    let stats = `stream: ${batch.startStream}..${batch.endStream}, ttfb: ${batch.firstByteTime - batch.startTime} ms, build time: ${batch.endTime - batch.startTime} ms, size: ${Math.round(batch.byteSize / 1000)} kb, items: ${batch.itemSize}`
    if (batch.blocks.length > 0) {
        stats = `last block: ${last(batch.blocks).header.number}, ` + stats
    }
    log.info(stats)
}
