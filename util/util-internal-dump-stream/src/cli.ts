import {type Command, ErrorMessage, nat} from '@subsquid/util-internal-dump-cli'
import zlib from 'node:zlib'
import {MISS_REASONS} from './message'
import {isDatasetName, parseServers} from './nats'
import {DEFAULT_STREAM_WAIT_TIMEOUT, type StreamMetrics} from './source'

export interface StreamOptions {
    streamUrl?: string
    streamDataset?: string
    streamWaitTimeout?: number
}

export interface StreamSettings {
    /**
     * One server URL or several separated by commas
     */
    url: string
    dataset: string
    waitTimeout?: number
}

/**
 * @param trust what a block must pass to be taken from the stream, for the help of `--stream-url`
 */
export function addStreamOptions(program: Command, trust: string): void {
    let urlHelp = [
        'NATS server with a JetStream stream of raw blocks, or a comma separated list of the servers of its cluster',
        'with the same scheme and credentials. Blocks found there are not fetched from RPC.',
        trust,
        'Requires Node.js 22.15 or later for its built-in zstd',
    ].join(' ')

    program.option('--stream-url <urls>', urlHelp)
    program.option(
        '--stream-dataset <name>',
        'Dataset name the raw blocks are published under: letters, digits, "_" and "-"',
    )
    program.option(
        '--stream-wait-timeout <ms>',
        'How long to retry a missing finalized block in the stream before using RPC; 0 disables waiting',
        nat,
        DEFAULT_STREAM_WAIT_TIMEOUT,
    )
}

/**
 * @returns `undefined` when the stream is off
 */
export function getStreamSettings(options: StreamOptions): StreamSettings | undefined {
    let {streamUrl, streamDataset} = options
    if (streamUrl == null && streamDataset == null) return undefined

    if (streamUrl == null || streamDataset == null) {
        throw new ErrorMessage('--stream-url and --stream-dataset must be set together')
    }

    try {
        parseServers(streamUrl)
    } catch (err: any) {
        throw new ErrorMessage(`invalid --stream-url: ${err.message}`)
    }

    if (!isDatasetName(streamDataset)) {
        throw new ErrorMessage(
            `invalid --stream-dataset '${streamDataset}': only letters, digits, "_" and "-" are allowed`,
        )
    }

    if (typeof zlib.zstdDecompressSync != 'function') {
        throw new ErrorMessage(
            `--stream-url requires Node.js 22.15 or later for its built-in zstd, running ${process.version}`,
        )
    }

    return {
        url: streamUrl,
        dataset: streamDataset,
        waitTimeout: options.streamWaitTimeout,
    }
}

interface Counter {
    inc(labels: Record<string, string>, value?: number): void
}

export interface CounterRegistry {
    createCounter(config: {name: string; help: string; labelNames?: string[]}): Counter
}

export function createStreamMetrics(registry: CounterRegistry): StreamMetrics {
    let blocks = registry.createCounter({
        name: 'sqd_dump_blocks_total',
        help: 'Number of blocks received by their source',
        labelNames: ['source'],
    })

    let misses = registry.createCounter({
        name: 'sqd_dump_stream_miss_total',
        help: 'Number of times blocks had to be fetched from RPC, by the reason the stream was not used for them',
        labelNames: ['reason'],
    })

    // Makes every series visible before its first event
    blocks.inc({source: 'stream'}, 0)
    blocks.inc({source: 'rpc'}, 0)
    for (let reason of MISS_REASONS) {
        misses.inc({reason}, 0)
    }

    return {
        blocks: (source, count) => blocks.inc({source}, count),
        miss: (reason) => misses.inc({reason}),
    }
}
