import {addErrorContext, annotateSyncError, last, Throttler} from '@subsquid/util-internal'
import {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import {RangeRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {mapBlock} from './ds-archive'
import {PortalClient} from '@subsquid/portal-client'
import {Rpc, RuntimeTracker, WithRuntime} from '@subsquid/substrate-data'
import {ArchiveBlock, ArchiveBlockHeader} from './interfaces/data-partial'
import {RpcClient} from '@subsquid/rpc-client'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime'
import {DataRequest} from './interfaces/data-request'
import {Block} from './mapping'
import {assertIsValid, IsInvalid} from '@subsquid/util-internal-ingest-tools'
import {DEFAULT_FIELDS, FieldSelection} from './interfaces/data'
import {mergeFields} from './selection'

function getFields(fields: FieldSelection | undefined) {
    return {
        block: {...DEFAULT_FIELDS.block, ...fields?.block, ...{
            number: true,
            hash: true,
            parentHash: true,
            specName: true,
            specVersion: true,
            implName: true,
            implVersion: true,
        }},
        event: {...DEFAULT_FIELDS.event, ...fields?.event, ...{
            index: true,
            extrinsicIndex: true,
            callAddress: true,
        }},
        call: {...DEFAULT_FIELDS.call, ...fields?.call, ...{
                extrinsicIndex: true,
            address: true,
        }},
        extrinsic: {...DEFAULT_FIELDS.extrinsic, ...fields?.extrinsic, ...{
            index: true,
        }},
    }
}

function makeQuery(req: RangeRequest<DataRequest>) {
    let {fields, ...request} = req.request

    return {
        ...request,
        type: 'substrate' as const,
        fromBlock: req.range.from,
        toBlock: req.range.to,
        fields: getFields(fields),
    }
}

export interface SubstratePortalOptions {
    client: PortalClient
    rpc: RpcClient
    typesBundle?: OldTypesBundle | OldSpecsBundle
}

export class SubstratePortal implements DataSource<Block, DataRequest> {
    private client: PortalClient
    private rpc: Rpc
    private typesBundle?: OldTypesBundle | OldSpecsBundle

    constructor(options: SubstratePortalOptions) {
        this.client = options.client
        this.rpc = new Rpc(options.rpc)
        this.typesBundle = options.typesBundle
    }

    getFinalizedHeight(): Promise<number> {
        return this.client.getFinalizedHeight()
    }

    async getBlockHash(height: number): Promise<string | null> {
        let query = makeQuery({
            range: {from: height, to: height},
            request: {includeAllBlocks: true},
        })
        let blocks = await this.client.getFinalizedQuery(query)
        return blocks[0]?.header?.hash || null
    }

    async *getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean | undefined
    ): AsyncIterable<Batch<Block>> {
        let runtimeTracker = new RuntimeTracker<ArchiveBlockHeader & WithRuntime>(
            this.rpc,
            (hdr) => ({height: hdr.number, hash: hdr.hash, parentHash: hdr.parentHash}),
            (hdr) => hdr,
            this.typesBundle
        )

        for (let req of requests) {
            let lastBlock = req.range.from - 1
            let endBlock = req.range.to || Infinity
            let query = makeQuery(req)

            for await (let {blocks: batch, finalizedHead} of this.client.getFinalizedStream(query)) {
                assert(batch.length > 0, 'boundary blocks are expected to be included')
                lastBlock = last(batch).header.number

                let headers: (ArchiveBlockHeader & IsInvalid)[] = batch.map((b) => b.header)
                await runtimeTracker.setRuntime(headers)
                assertIsValid(headers)

                let blocks = batch.map((b) => {
                    try {
                        return this.mapBlock(b as ArchiveBlock)
                    } catch (err: any) {
                        throw addErrorContext(err, {
                            blockHeight: b.header.number,
                            blockHash: b.header.hash,
                        })
                    }
                })

                let isHead = lastBlock >= (finalizedHead?.number ?? -1)
                
                yield {
                    blocks,
                    isHead,
                }

                if (stopOnHead && isHead) {
                    break
                }
            }

            // stream ended before requested range,
            // which means we reached the last available block
            // should not happen if stopOnHead is set to false
            if (lastBlock < endBlock) {
                assert(stopOnHead, 'unexpected end of stream')
                break
            }
        }
    }

    @annotateSyncError((src: ArchiveBlock) => ({blockHeight: src.header.number, blockHash: src.header.hash}))
    private mapBlock(src: ArchiveBlock): Block {
        return mapBlock(src)
    }
}
