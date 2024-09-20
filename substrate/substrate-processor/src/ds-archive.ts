import {RpcClient} from '@subsquid/rpc-client'
import {Rpc, RuntimeTracker, WithRuntime} from '@subsquid/substrate-data'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {annotateSyncError, assertNotNull} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {archiveIngest, assertIsValid, IsInvalid} from '@subsquid/util-internal-ingest-tools'
import {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {DEFAULT_FIELDS, FieldSelection} from './interfaces/data'
import {ArchiveBlock, ArchiveBlockHeader} from './interfaces/data-partial'
import {DataRequest} from './interfaces/data-request'
import {Block, BlockHeader, Call, Event, Extrinsic, setUpItems} from './mapping'


interface ArchiveQuery extends DataRequest {
    type: 'substrate'
}


export interface SubstrateArchiveOptions {
    client: ArchiveClient
    rpc: RpcClient
    typesBundle?:  OldTypesBundle | OldSpecsBundle
}


export class SubstrateArchive implements DataSource<Block, DataRequest> {
    private client: ArchiveClient
    private rpc: Rpc
    private typesBundle?:  OldTypesBundle | OldSpecsBundle

    constructor(options: SubstrateArchiveOptions) {
        this.client = options.client
        this.rpc = new Rpc(options.rpc)
        this.typesBundle = options.typesBundle
    }

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    getBlockHash(height: number): Promise<string | null> {
        return this.rpc.getBlockHash(height)
    }

    async *getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean): AsyncIterable<Batch<Block>> {

        let runtimeTracker = new RuntimeTracker<ArchiveBlockHeader & WithRuntime>(
            this.rpc,
            hdr => ({height: hdr.number, hash: hdr.hash, parentHash: hdr.parentHash}),
            hdr => hdr,
            this.typesBundle
        )

        let archiveRequests = mapRangeRequestList(requests, req => {
            let {fields, ...items} = req
            let q: ArchiveQuery = {
                type: 'substrate',
                fields: getFields(fields),
                ...items
            }
            return q
        })

        for await (let {blocks, isHead} of archiveIngest<ArchiveBlock>({
            client: this.client,
            requests: archiveRequests,
            stopOnHead
        })) {
            let headers: (ArchiveBlockHeader & IsInvalid)[] = blocks.map(b => b.header)
            await runtimeTracker.setRuntime(headers)
            assertIsValid(headers)

            yield {
                blocks: blocks.map(b => this.mapBlock(b)),
                isHead
            }
        }
    }

    @annotateSyncError((src: ArchiveBlock) => ({blockHeight: src.header.number, blockHash: src.header.hash}))
    private mapBlock(src: ArchiveBlock): Block {
        let block = new Block(new BlockHeader(
            assertNotNull(src.header.runtime),
            assertNotNull(src.header.runtimeOfPrevBlock),
            {
                height: src.header.number,
                ...src.header
            }
        ))

        if (src.extrinsics) {
            for (let s of src.extrinsics) {
                let extrinsic = new Extrinsic(block.header, s.index)
                if (s.version != null) {
                    extrinsic.version = s.version
                }
                if (s.signature != null) {
                    extrinsic.signature = s.signature
                }
                if (s.fee != null) {
                    extrinsic.fee = BigInt(s.fee)
                }
                if (s.tip != null) {
                    extrinsic.tip = BigInt(s.tip)
                }
                if (s.error != null) {
                    extrinsic.error = s.error
                }
                if (s.success != null) {
                    extrinsic.success = s.success
                }
                if (s.hash != null) {
                    extrinsic.hash = s.hash
                }
                block.extrinsics.push(extrinsic)
            }
        }

        if (src.calls) {
            for (let s of src.calls) {
                let call = new Call(block.header, s.extrinsicIndex, s.address)
                if (s.name) {
                    call.name = s.name
                }
                if (s.args != null) {
                    call.args = s.args
                }
                if (s.origin != null) {
                    call.origin = s.origin
                }
                if (s.error != null) {
                    call.error = s.error
                }
                if (s.success != null) {
                    call.success = s.success
                }
                block.calls.push(call)
            }
        }

        if (src.events) {
            for (let s of src.events) {
                let event = new Event(block.header, s.index)
                if (s.name != null) {
                    event.name = s.name
                }
                if (s.args != null) {
                    event.args = s.args
                }
                if (s.phase != null) {
                    event.phase = s.phase
                }
                if (s.extrinsicIndex != null) {
                    event.extrinsicIndex = s.extrinsicIndex
                }
                if (s.callAddress != null) {
                    event.callAddress = s.callAddress
                }
                if (s.topics != null) {
                    event.topics = s.topics
                }
                block.events.push(event)
            }
        }

        setUpItems(block)
        return block
    }
}


type Selector<Keys extends string> = {
    [K in Keys]?: boolean
}


function mergeFields<Keys extends string>(def: Selector<Keys>, requested?: Selector<Keys>, required?: Selector<Keys>): Selector<Keys> {
    let fields: Selector<Keys> = {...def}
    for (let key in requested) {
        fields[key] = requested[key]
    }
    Object.assign(fields, required)
    return fields
}


function getFields(fields: FieldSelection | undefined): FieldSelection {
    return {
        block: mergeFields(DEFAULT_FIELDS.block, fields?.block, {
            specName: true,
            specVersion: true,
            implName: true,
            implVersion: true
        }),
        event: mergeFields(DEFAULT_FIELDS.event, fields?.event),
        call: mergeFields(DEFAULT_FIELDS.call, fields?.call),
        extrinsic: mergeFields(DEFAULT_FIELDS.extrinsic, fields?.extrinsic)
    }
}
