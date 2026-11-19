import type {Transform} from 'stream'
import zlib from 'zlib'


export type Compression = 'gzip' | 'zstd'


export const COMPRESSIONS: readonly Compression[] = ['gzip', 'zstd']


export const DEFAULT_ZSTD_LEVEL = 9


// 2^27 is the largest window zstd decoders accept without extra settings
const ZSTD_WINDOW_LOG = 27


export function getBlocksFileName(compression: Compression): string {
    switch(compression) {
        case 'gzip':
            return 'blocks.jsonl.gz'
        case 'zstd':
            return 'blocks.jsonl.zst'
    }
}


export function getOtherCompression(compression: Compression): Compression {
    return compression == 'gzip' ? 'zstd' : 'gzip'
}


export function createCompressor(compression: Compression, level?: number, chunkSize?: number): Transform {
    switch(compression) {
        case 'gzip':
            return zlib.createGzip({level, chunkSize})
        case 'zstd':
            assertZstdSupport()
            return zlib.createZstdCompress({
                chunkSize,
                params: {
                    [zlib.constants.ZSTD_c_compressionLevel]: level ?? DEFAULT_ZSTD_LEVEL,
                    [zlib.constants.ZSTD_c_checksumFlag]: 1,
                    [zlib.constants.ZSTD_c_enableLongDistanceMatching]: 1,
                    [zlib.constants.ZSTD_c_windowLog]: ZSTD_WINDOW_LOG
                }
            })
    }
}


export function createDecompressor(compression: Compression, chunkSize?: number): Transform {
    switch(compression) {
        case 'gzip':
            return zlib.createGunzip({chunkSize})
        case 'zstd':
            assertZstdSupport()
            return zlib.createZstdDecompress({chunkSize})
    }
}


function assertZstdSupport(): void {
    if (typeof zlib.createZstdCompress != 'function') {
        throw new Error(`zstd requires Node.js 22.15 or later, running ${process.version}`)
    }
}
