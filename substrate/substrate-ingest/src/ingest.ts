import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {Block, DataRequest, Parser, RpcDataSource} from '@subsquid/substrate-data'
import * as raw from '@subsquid/substrate-data-raw'
import {
    getOldTypesBundle,
    OldSpecsBundle,
    OldTypesBundle,
    readOldTypesBundle
} from '@subsquid/substrate-runtime/lib/metadata'
import {assertNotNull, def, ensureError, wait} from '@subsquid/util-internal'
import {ArchiveLayout, DataChunk, getChunkPath} from '@subsquid/util-internal-archive-layout'
import {createFs} from '@subsquid/util-internal-fs'
import {toJSON} from '@subsquid/util-internal-json'
import {Range, rangeEnd} from '@subsquid/util-internal-range'
import * as readline from 'readline'
import {Writable} from 'stream'
import {pipeline} from 'stream/promises'
import {createGunzip} from 'zlib'


export interface IngestOptions {
    rawArchive?: string
    endpoint?: string
    endpointCapacity: number
    endpointRateLimit?: number
    endpointMaxBatchCallSize?: number
    typesBundle?: string
}


export class Ingest {
    private log = createLogger('sqd:substrate-ingest')

    constructor(private options: IngestOptions) {}

    @def
    dataRequest(): DataRequest {
        return {
            blockValidator: true,
            blockTimestamp: true,
            events: true,
            extrinsics: {
                fee: true,
                hash: true
            }
        }
    }

    @def
    rpc(): RpcClient {
        return new RpcClient({
            url: assertNotNull(this.options.endpoint, 'chain RPC endpoint is required'),
            capacity: this.options.endpointCapacity,
            rateLimit: this.options.endpointRateLimit,
            maxBatchCallSize: this.options.endpointMaxBatchCallSize,
            retryAttempts: Number.MAX_SAFE_INTEGER
        })
    }

    @def
    typesBundle(): OldTypesBundle | OldSpecsBundle | undefined {
        if (this.options.typesBundle == null) return
        return getOldTypesBundle(this.options.typesBundle) || readOldTypesBundle(this.options.typesBundle)
    }

    @def
    private archive(): ArchiveLayout {
        let fs = createFs(assertNotNull(this.options.rawArchive))
        return new ArchiveLayout(fs)
    }

    private async *getArchiveChunks(range: Range): AsyncIterable<DataChunk> {
        while (true) {
            for await (let chunk of this.archive().getDataChunks(range)) {
                yield chunk
                if (chunk.to >= rangeEnd(range)) return
                range = {
                    from: chunk.to + 1,
                    to: range.to
                }
            }
            this.log.info('waiting 1 minute for new chunks')
            await wait(60_000)
        }
    }

    private async archiveIngest(range: Range, cb: (blocks: Block[]) => Promise<void>): Promise<void> {
        let parser = new Parser(
            new raw.Rpc(this.rpc()),
            [{
                range,
                request: this.dataRequest()
            }],
            this.typesBundle()
        )

        const process = async (rawBlocks: raw.BlockData[]) => {
            if (rawBlocks.length == 0) return
            let blocks = await parser.parseCold(rawBlocks)
            await cb(blocks)
        }

        for await (let chunk of this.getArchiveChunks(range)) {
            this.log.info(`processing chunk ${getChunkPath(chunk)}`)
            let fs = this.archive().getChunkFs(chunk)
            await pipeline(
                await fs.readStream('blocks.jsonl.gz'),
                createGunzip(),
                input => readline.createInterface({input, crlfDelay: Infinity}),
                async lines => {
                    let batch = []
                    for await (let line of lines) {
                        let block: raw.BlockData = JSON.parse(line)
                        if (range.from <= block.height && block.height <= rangeEnd(range)) {
                            batch.push(block)
                            if (batch.length >= 20) {
                                await process(batch)
                                batch = []
                            }
                        }
                    }
                    await process(batch)
                }
            )
        }
    }

    private async rpcIngest(range: Range, cb: (blocks: Block[]) => Promise<void>): Promise<void> {
        let ds = new RpcDataSource({
            rpc: this.rpc(),
            typesBundle: this.typesBundle()
        })

        for await (let batch of ds.getFinalizedBlocks([{range, request: this.dataRequest()}])) {
            await cb(batch.blocks)
        }
    }

    private async write(out: Writable, blocks: Block[]): Promise<void> {
        let flushed = true
        for (let block of blocks) {
            flushed = out.write(JSON.stringify(toJSON(block)) + '\n')
        }
        if (!flushed) {
            await waitDrain(out)
        }
    }

    async run(range: Range, out: Writable): Promise<void> {
        if (this.options.rawArchive) {
            await this.archiveIngest(range, blocks => this.write(out, blocks))
        } else {
            await this.rpcIngest(range, blocks => this.write(out, blocks))
        }
    }
}


function waitDrain(out: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
        if (out.errored || out.destroyed || out.closed) {
            return reject(new Error('output stream is no longer writable'))
        }

        function cleanup() {
            out.removeListener('error', error)
            out.removeListener('drain', drain)
        }

        function drain() {
            cleanup()
            resolve()
        }

        function error(err: any) {
            cleanup()
            reject(ensureError(err))
        }

        out.on('drain', drain)
        out.on('error', error)
    })
}
