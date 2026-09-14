import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {ArchiveLayout, DEFAULT_ZSTD_LEVEL, getChunkPath} from '@subsquid/util-internal-archive-layout'
import {FileOrUrl, nat, positiveInt, positiveReal} from '@subsquid/util-internal-commander'
import {createFs} from '@subsquid/util-internal-fs'
import {Command, InvalidArgumentError} from 'commander'
import {availableParallelism} from 'os'
import {ChunkRange, convert, getStatus} from './recompress'


// zlib streams run on the libuv thread pool, which has 4 threads unless this is set before its first use
process.env.UV_THREADPOOL_SIZE ??= String(availableParallelism())


const log = createLogger('sqd:raw-archive-recompress')


function openArchive(url: string): ArchiveLayout {
    return new ArchiveLayout(createFs(url))
}


function checkRange(range: ChunkRange): ChunkRange {
    if (range.from != null && range.to != null && range.from >= range.to) {
        throw new InvalidArgumentError('--from must be below --to')
    }
    return range
}


const program = new Command()

program
    .name('raw-archive-recompress')
    .description('Converts gzip data chunks of a raw archive to zstd')

program
    .command('status')
    .description('Print where the trailing run of zstd chunks starts')
    .argument('<archive>', 'Either local dir or s3:// url', FileOrUrl(['s3:']))
    .option('--from <block>', 'Only chunks that start at or above this block', nat)
    .option('--to <block>', 'Only chunks that start below this block', nat)
    .action(async (archive: string, options: ChunkRange) => {
        let range = checkRange(options)
        let status = await getStatus(openArchive(archive), range)
        let firstZstdChunk = status.firstZstdChunk

        let report = {
            archive,
            from: range.from ?? null,
            to: range.to ?? null,
            chunks: status.chunks,
            newest: status.newest ?? null,
            firstZstdChunk: firstZstdChunk ? getChunkPath(firstZstdChunk) : null,
            firstZstdBlock: firstZstdChunk?.from ?? null,
            gzipChunks: status.gzipChunks ?? null
        }
        process.stdout.write(JSON.stringify(report) + '\n')
    })

program
    .command('convert')
    .description('Convert gzip chunks below the trailing run of zstd chunks, newest first')
    .argument('<archive>', 'Either local dir or s3:// url', FileOrUrl(['s3:']))
    .option('--from <block>', 'Stop before the first chunk that starts below this block', nat)
    .option('--to <block>', 'Skip chunks that start at or above this block; with --from on another host, splits the archive', nat)
    .option('--concurrency <number>', 'Chunks converted at once', positiveInt, 1)
    .option('--level <number>', 'zstd compression level', nat, DEFAULT_ZSTD_LEVEL)
    .option('--rate-limit <MB/s>', 'Limit of bytes read and written, in megabytes per second', positiveReal)
    .action(async (archive: string, options: ChunkRange & {concurrency: number, level: number, rateLimit?: number}) => {
        let range = checkRange(options)
        let result = await convert(openArchive(archive), {
            from: range.from,
            to: range.to,
            concurrency: options.concurrency,
            level: options.level,
            bytesPerSecond: options.rateLimit == null ? undefined : options.rateLimit * 1024 * 1024,
            log
        })
        log.info(`converted ${result.chunks} chunks: ${result.gzipBytes} -> ${result.zstdBytes} bytes`)
    })


runProgram(async () => {
    await program.parseAsync()
}, err => {
    log.fatal(err)
})
