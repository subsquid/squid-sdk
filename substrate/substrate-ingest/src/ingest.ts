import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {Block, DataRequest, Parser, RpcDataSource} from '@subsquid/substrate-data'
import * as raw from '@subsquid/substrate-data-raw'
import {getOldTypesBundle, OldSpecsBundle, OldTypesBundle, readOldTypesBundle} from '@subsquid/substrate-metadata'
import {assertNotNull, def, ensureError, wait} from '@subsquid/util-internal'
import {ArchiveLayout, DataChunk, getChunkPath} from '@subsquid/util-internal-archive-layout'
import {createFs} from '@subsquid/util-internal-fs'
import {toJSON} from '@subsquid/util-internal-json'
import {assertRange, Range, rangeEnd, RangeRequestList} from '@subsquid/util-internal-range'
import * as readline from 'readline'
import {Writable} from 'stream'
import {pipeline} from 'stream/promises'
import {createGunzip} from 'zlib'


export interface IngestOptions {
    rawArchive?: string
    endpoint?: string
    endpointCapacity: number
    endpointRateLimit?: number
    firstBlock?: number
    lastBlock?: number
    typesBundle?: string
}


export class Ingest {
    private log = createLogger('sqd:substrate-ingest')

    constructor(private options: IngestOptions) {}

    @def
    range(): Range {
        let range = {
            from: this.options.firstBlock ?? 0,
            to: this.options.lastBlock
        }
        assertRange(range)
        return range
    }

    @def
    dataRequest(): RangeRequestList<DataRequest> {
        return [{
            range: this.range(),
            request: {
                extrinsics: true,
                extrinsicHash: true,
                validator: true,
                events: true
            }
        }]
    }

    @def
    rpc(): RpcClient {
        return new RpcClient({
            url: assertNotNull(this.options.endpoint, 'chain RPC endpoint is required'),
            capacity: this.options.endpointCapacity,
            rateLimit: this.options.endpointRateLimit,
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

    private async *getArchiveChunks(): AsyncIterable<DataChunk> {
        let range = this.range()
        while (true) {
            for await (let chunk of this.archive().getDataChunks(range)) {
                yield chunk
                if (chunk.to >= rangeEnd(range)) return
            }
            this.log.info('waiting 1 minute for new chunks')
            await wait(60_000)
        }
    }

    private async archiveIngest(cb: (blocks: Block[]) => Promise<void>): Promise<void> {
        let range = this.range()

        let parser = new Parser(
            new raw.Rpc(this.rpc()),
            this.dataRequest(),
            this.typesBundle()
        )

        const process = async (rawBlocks: raw.BlockData[]) => {
            if (rawBlocks.length == 0) return
            let blocks = await parser.parse(rawBlocks)
            await cb(blocks)
        }

        for await (let chunk of this.getArchiveChunks()) {
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

    private async rpcIngest(cb: (blocks: Block[]) => Promise<void>) {
        let ds = new RpcDataSource({
            rpc: this.rpc(),
            typesBundle: this.typesBundle()
        })

        for await (let batch of ds.getFinalizedBlocks(this.dataRequest())) {
            await cb(batch.blocks)
        }
    }

    private async dumpToStdout(blocks: Block[]): Promise<void> {
        let drain = false
        for (let block of blocks) {
            drain = process.stdout.write(JSON.stringify(toJSON(block)) + '\n')
        }
        if (drain) {
            await waitDrain(process.stdout)
        }
    }

    @def
    async run(): Promise<void> {
        if (this.options.rawArchive) {
            await this.archiveIngest(blocks => this.dumpToStdout(blocks))
        } else {
            await this.rpcIngest(blocks => this.dumpToStdout(blocks))
        }
    }
}


function waitDrain(out: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
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
