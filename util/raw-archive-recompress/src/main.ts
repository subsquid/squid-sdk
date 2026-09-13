import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {ArchiveLayout, DEFAULT_ZSTD_LEVEL, getChunkPath} from '@subsquid/util-internal-archive-layout'
import {FileOrUrl, nat, positiveReal} from '@subsquid/util-internal-commander'
import {createFs} from '@subsquid/util-internal-fs'
import {Command} from 'commander'
import {convert, getStatus} from './recompress'


const log = createLogger('sqd:raw-archive-recompress')


function openArchive(url: string): ArchiveLayout {
    return new ArchiveLayout(createFs(url))
}


const program = new Command()

program
    .name('raw-archive-recompress')
    .description('Converts gzip data chunks of a raw archive to zstd')

program
    .command('status')
    .description('Print where the trailing run of zstd chunks starts')
    .argument('<archive>', 'Either local dir or s3:// url', FileOrUrl(['s3:']))
    .action(async (archive: string) => {
        let status = await getStatus(openArchive(archive))
        let firstZstdChunk = status.firstZstdChunk

        let report = {
            archive,
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
    .option('--level <number>', 'zstd compression level', nat, DEFAULT_ZSTD_LEVEL)
    .option('--rate-limit <MB/s>', 'Limit of bytes read and written, in megabytes per second', positiveReal)
    .action(async (archive: string, options: {from?: number, level: number, rateLimit?: number}) => {
        let result = await convert(openArchive(archive), {
            from: options.from,
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
