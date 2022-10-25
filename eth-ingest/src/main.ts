import {createLogger} from '@subsquid/logger'
import {assertNotNull, last, runProgram, wait} from '@subsquid/util-internal'
import {Progress} from '@subsquid/util-internal-counters'
import {toJSON} from '@subsquid/util-internal-json'
import {Ingest} from './ingest'
import {HttpRpcClient} from './rpc'


const log = createLogger('eth-ingest')


runProgram(async () => {
    let rpc = new HttpRpcClient(assertNotNull(process.env.ETH_NODE))

    let fromBlock = 15_000_000
    let toBlock = 15_500_000

    let progress = new Progress({
        initialValue: fromBlock - 1,
        windowSize: 10,
        windowGranularitySeconds: 1
    })

    every(5000, () => {
        if (!progress.hasNews()) return
        log.info(`last block: ${progress.getCurrentValue()}, progress: ${Math.round(progress.speed())} blocks/sec`)
    })

    for await (let batch of Ingest.getBlocks({rpc, fromBlock, toBlock})) {
        for (let block of batch) {
            process.stdout.write(JSON.stringify(toJSON(block)) + '\n')
        }
        progress.setCurrentValue(last(batch).header.number)
    }

    await wait(100) // hack: waiting for stdout to be flushed
}, err => log.fatal(err))


function every(ms: number, cb: () => void): void {
    setTimeout(() => {
        try {
            cb()
            every(ms, cb)
        } catch (e: any) {
            log.fatal(e)
            process.exit(1)
        }
    }, ms)
}

