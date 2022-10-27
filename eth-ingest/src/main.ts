import {createLogger} from '@subsquid/logger'
import {last, runProgram} from '@subsquid/util-internal'
import {nat, Url} from '@subsquid/util-internal-commander'
import {Progress} from '@subsquid/util-internal-counters'
import {toJSON} from '@subsquid/util-internal-json'
import {Command} from 'commander'
import {Ingest} from './ingest'
import {HttpRpcClient} from './rpc'
import WritableStream = NodeJS.WritableStream


const log = createLogger('eth-ingest')


runProgram(async () => {
    let program = new Command()

    program.description('Data dumper for ethereum compatible chains')

    program.requiredOption('-e, --endpoint <url...>', 'http rpc endpoint', Url(['http:', 'https:']))
    program.option('--concurrency <number>', 'maximum number of pending data requests allowed', nat, 5)
    program.option('--from-block <number>', 'first block to ingest', nat)
    program.option('--to-block <number>', 'last block to ingest', nat)

    let options = program.parse().opts() as {
        endpoint: string
        concurrency: number
        fromBlock?: number
        toBlock?: number
    }

    let rpc = new HttpRpcClient(options.endpoint)
    let fromBlock = options.fromBlock ?? 0
    let toBlock = options.toBlock
    let concurrency = options.concurrency

    if (concurrency > 10) {
        concurrency = 10
        log.warn('setting concurrency level to 10, greater levels are not yet supported')
    }

    let progress = new Progress({
        initialValue: fromBlock - 1,
        windowSize: 10,
        windowGranularitySeconds: 1
    })

    let writing = new Progress({
        initialValue: 0,
        windowSize: 10,
        windowGranularitySeconds: 1
    })

    function report() {
        if (!progress.hasNews()) return
        log.info([
            `last block: ${progress.getCurrentValue()}`,
            `progress: ${Math.round(progress.speed())} blocks/sec`,
            `writing: ${Math.round(writing.speed() / 1024)} kb/sec`
        ].join(', '))
    }

    every(5000, report)

    let bytes = 0

    for await (let batch of Ingest.getBlocks({rpc, fromBlock, toBlock, concurrency})) {
        for (let block of batch) {
            let line = JSON.stringify(toJSON(block)) + '\n'
            bytes += line.length
            if (!process.stdout.write(line)) {
                await drain(process.stdout)
            }
        }
        progress.setCurrentValue(last(batch).header.number)
        writing.setCurrentValue(bytes)
    }

    report()
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


function drain(stream: WritableStream): Promise<void> {
    return new Promise((resolve, reject) => {
        function ondrain() {
            cleanup()
            resolve()
        }

        function onerror(err: Error) {
            cleanup()
            reject(err)
        }

        function cleanup() {
            stream.off('drain', ondrain)
            stream.off('error', onerror)
        }

        stream.on('drain', ondrain)
        stream.on('error', onerror)
    })
}
