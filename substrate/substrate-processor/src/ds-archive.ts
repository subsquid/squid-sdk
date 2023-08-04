import {HttpClient} from '@subsquid/http-client'
import {RpcClient} from '@subsquid/rpc-client'
import {Rpc, RuntimeTracker, WithRuntime} from '@subsquid/substrate-data'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-metadata'
import {annotateSyncError, assertNotNull, wait, withErrorContext} from '@subsquid/util-internal'
import {
    archiveIngest,
    Batch,
    DataSource,
    PollingHeightTracker,
    RangeRequest,
    RangeRequestList
} from '@subsquid/util-internal-processor-tools'
import {DEFAULT_FIELDS, FieldSelection} from './interfaces/data'
import {ArchiveBlock, ArchiveBlockHeader, PartialBlockHeader} from './interfaces/data-partial'
import {DataRequest} from './interfaces/data-request'
import {Block, BlockHeader, Call, Event, Extrinsic, setUpItems} from './mapping'


interface ArchiveQuery extends DataRequest {
    type: 'substrate'
    fromBlock: number
    toBlock?: number
}


export interface SubstrateArchiveOptions {
    http: HttpClient
    rpc: RpcClient
    typesBundle?:  OldTypesBundle | OldSpecsBundle
}


export class SubstrateArchive implements DataSource<Block, DataRequest> {
    private http: HttpClient
    private rpc: Rpc
    private typesBundle?:  OldTypesBundle | OldSpecsBundle

    constructor(options: SubstrateArchiveOptions) {
        this.http = options.http
        this.rpc = new Rpc(options.rpc)
        this.typesBundle = options.typesBundle
    }

    async getFinalizedHeight(): Promise<number> {
        let s = await this.http.get('/height')
        return parseInt(s)
    }

    getBlockHash(height: number): Promise<string> {
        return this.rpc.getBlockHash(height)
    }

    getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean): AsyncIterable<Batch<Block>> {

        let runtimeTracker = new RuntimeTracker<ArchiveBlockHeader & WithRuntime>(
            hdr => ({height: hdr.number, hash: hdr.hash, parentHash: hdr.parentHash}),
            hdr => hdr,
            this.rpc,
            this.typesBundle
        )

        return archiveIngest({
            requests,
            heightTracker: new PollingHeightTracker(() => this.getFinalizedHeight(), 30_000),
            query: async s => {
                let blocks = await this.query(s)
                await runtimeTracker.setRuntime(blocks.map(b => b.header))
                return blocks.map(b => this.mapBlock(b))
            },
            stopOnHead
        })
    }

    private async query(req: RangeRequest<DataRequest>): Promise<ArchiveBlock[]> {
        let {fields, ...items} = req.request
        let q: ArchiveQuery = {
            type: 'substrate',
            fromBlock: req.range.from,
            toBlock: req.range.to,
            fields: getFields(fields),
            ...items
        }

        let blocks: ArchiveBlock[] | null = null
        let retrySchedule = [5000, 10000, 20000]
        let retries = 0
        while (blocks == null) {
            blocks = await this.performQuery(q).catch(async err => {
                if (this.http.isRetryableError(err)) {
                    let pause = retrySchedule[Math.min(retries, retrySchedule.length - 1)]
                    retries += 1
                    await wait(pause)
                    return null
                }
                throw err
            })
        }

        return blocks
    }

    private async performQuery(q: ArchiveQuery): Promise<ArchiveBlock[]> {
        let worker: string = await this.http.get(`/${q.fromBlock}/worker`)
        return this.http.post(worker, {
            json: q,
            retryAttempts: 2,
            retrySchedule: [1000]
        }).catch(
            withErrorContext({archiveQuery: q})
        )
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
