import type {PortalClient, substrate as portal} from '@subsquid/portal-client'
import type {RpcClient} from '@subsquid/rpc-client'
import {Rpc, RuntimeTracker, type WithRuntime} from '@subsquid/substrate-data'
import {setEmittedContractAddress} from '@subsquid/substrate-data/lib/extension/contracts'
import {setEthereumTransact, setEvmLog} from '@subsquid/substrate-data/lib/extension/evm'
import {setGearProgramId} from '@subsquid/substrate-data/lib/extension/gear'
import {setReviveContractEmitted} from '@subsquid/substrate-data/lib/extension/revive'
import type {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {annotateSyncError, assertNotNull, last, wait} from '@subsquid/util-internal'
import {assertIsValid, type IsInvalid} from '@subsquid/util-internal-ingest-tools'
import type {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import type {RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {filterBlock} from './ds-rpc-filter'
import {DEFAULT_FIELDS, type FieldSelection} from './interfaces/data'
import type {ArchiveBlock, ArchiveBlockHeader} from './interfaces/data-partial'
import type {DataRequest} from './interfaces/data-request'
import {Block, BlockHeader, Call, Event, Extrinsic, setUpItems} from './mapping'

export interface SubstratePortalOptions {
    client: PortalClient
    rpc: RpcClient
    typesBundle?: OldTypesBundle | OldSpecsBundle
    /**
     * Headers sent with every portal request
     */
    headers?: Record<string, string>
    /**
     * How often to poll the portal for new finalized blocks once
     * the processor caught up with it, in `ms`
     */
    headPollInterval?: number
    /**
     * Number of retries of a failed portal request, `0` disables retries
     */
    retryAttempts?: number
}

/**
 * Finalized block source backed by an SQD Portal dataset.
 *
 * The portal serves finalized blocks only. Chain RPC is still required
 * to fetch runtime metadata (and is used for block hash lookups).
 */
export class SubstratePortal implements DataSource<Block, DataRequest> {
    private client: PortalClient
    private rpc: Rpc
    private typesBundle?: OldTypesBundle | OldSpecsBundle
    private headers?: Record<string, string>
    private headPollInterval: number
    private retryAttempts?: number

    constructor(options: SubstratePortalOptions) {
        this.client = options.client
        this.rpc = new Rpc(options.rpc)
        this.typesBundle = options.typesBundle
        this.headers = options.headers
        this.headPollInterval = options.headPollInterval ?? 5_000
        this.retryAttempts = options.retryAttempts
    }

    async getFinalizedHeight(): Promise<number> {
        let head = await this.client.getFinalizedHead(this.getRequestOptions())
        return head?.number ?? -1
    }

    getBlockHash(height: number): Promise<string | null> {
        return this.rpc.getBlockHash(height)
    }

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean,
    ): AsyncIterable<Batch<Block>> {
        let runtimeTracker = new RuntimeTracker<ArchiveBlockHeader & WithRuntime>(
            this.rpc,
            (hdr) => ({height: hdr.number, hash: hdr.hash, parentHash: hdr.parentHash}),
            (hdr) => hdr,
            this.typesBundle,
        )

        for (let req of requests) {
            let beg = req.range.from
            let end = req.range.to ?? Number.POSITIVE_INFINITY
            let exactFilter = needsExactFilter(req.request)

            while (beg <= end) {
                let head = await this.getFinalizedHeight()
                if (head < beg) {
                    if (stopOnHead) return
                    await wait(this.headPollInterval)
                    continue
                }

                let query = toPortalQuery({range: {from: beg, to: req.range.to}, request: req.request})
                let streamFrom = beg

                for await (let {blocks: batch, meta} of this.client.getFinalizedStream(query, {
                    request: this.getRequestOptions(),
                })) {
                    if (meta.finalizedHeadNumber != null) {
                        head = Math.max(head, meta.finalizedHeadNumber)
                    }

                    // A batch without blocks means the portal answered without data: either we are at its head,
                    // or it has nothing to serve yet. Leave the stream (which would otherwise re-request
                    // without delay) and let the outer loop stop, wait for new blocks or back off.
                    if (batch.length == 0) break

                    let blocks = batch as unknown as ArchiveBlock[]
                    let lastBlock = last(blocks).header.number
                    assert(lastBlock >= beg)
                    beg = lastBlock + 1

                    let headers: (ArchiveBlockHeader & IsInvalid)[] = blocks.map((b) => b.header)
                    await runtimeTracker.setRuntime(headers)
                    assertIsValid(headers)

                    let isHead = beg > head

                    yield {
                        blocks: blocks.map((b) => {
                            let block = this.mapBlock(b)
                            if (exactFilter) {
                                applyRequest(block, req.request)
                            }
                            return block
                        }),
                        isHead,
                    }

                    // Leave the stream at the head, the outer loop
                    // decides whether to stop or to wait for new blocks.
                    if (isHead) break
                }

                // The stream ended without data although the portal reported blocks ahead,
                // back off instead of re-requesting in a loop.
                if (beg == streamFrom) {
                    await wait(this.headPollInterval)
                }
            }
        }
    }

    private getRequestOptions() {
        // passed per request: `PortalClient` can not tell an explicit `0` set on its HTTP client from an unset value
        return {headers: this.headers, retryAttempts: this.retryAttempts}
    }

    @annotateSyncError((src: ArchiveBlock) => ({blockHeight: src.header.number, blockHash: src.header.hash}))
    private mapBlock(src: ArchiveBlock): Block {
        return mapBlock(src)
    }
}

type Selector<Keys extends string> = {
    [K in Keys]?: boolean
}

function mergeFields<Keys extends string>(
    def: Selector<Keys>,
    requested?: Selector<Keys>,
    required?: Selector<Keys>,
): Selector<Keys> {
    let fields: Selector<Keys> = {...def}
    for (let key in requested) {
        fields[key] = requested[key]
    }
    Object.assign(fields, required)
    return fields
}

/**
 * Unlike the legacy archive, the portal returns only the fields that were asked for,
 * so the fields the processor relies on are always requested explicitly.
 */
export function getFields(fields: FieldSelection | undefined, needItemArgs?: boolean): portal.FieldSelection {
    // client side filtering inspects names and args of all events and calls
    let itemArgs = needItemArgs ? {name: true, args: true} : undefined
    return {
        block: mergeFields<any>(DEFAULT_FIELDS.block, fields?.block, {
            parentHash: true,
            specName: true,
            specVersion: true,
            implName: true,
            implVersion: true,
        }),
        extrinsic: mergeFields<any>(DEFAULT_FIELDS.extrinsic, fields?.extrinsic, {
            index: true,
        }),
        call: mergeFields<any>(DEFAULT_FIELDS.call, fields?.call, {
            extrinsicIndex: true,
            address: true,
            ...itemArgs,
        }),
        event: mergeFields<any>(DEFAULT_FIELDS.event, fields?.event, {
            index: true,
            extrinsicIndex: true,
            callAddress: true,
            ...itemArgs,
        }),
    }
}

const GEAR_MESSAGE_QUEUED = 'Gear.MessageQueued'

/**
 * Maps a processor data request to a portal query.
 *
 * `gearMessagesQueued` requests are sent as plain `Gear.MessageQueued` event requests
 * rather than as the portal's own `gearMessagesEnqueued` request, which is not safe to rely on:
 * portals released before it was fixed match nothing with it, and its program id filter reads
 * a column that archived blocks do not all carry. When such requests select program ids,
 * the portal returns a superset, which is narrowed down on the client by {@link applyRequest}.
 */
export function toPortalQuery(req: RangeRequest<DataRequest>): portal.Query {
    let {fields, gearMessagesQueued, ...items} = req.request

    let events = items.events
    if (gearMessagesQueued?.length) {
        events = [
            ...(events ?? []),
            ...gearMessagesQueued.map(({programId, ...relations}) => ({
                ...relations,
                name: [GEAR_MESSAGE_QUEUED],
            })),
        ]
    }

    return {
        type: 'substrate',
        fromBlock: req.range.from,
        toBlock: req.range.to,
        fields: getFields(fields, needsExactFilter(req.request)),
        includeAllBlocks: items.includeAllBlocks,
        events,
        calls: items.calls,
        evmLogs: items.evmLogs,
        ethereumTransactions: items.ethereumTransactions,
        contractsEvents: items.contractsEvents,
        gearUserMessagesSent: items.gearUserMessagesSent,
        reviveContractEmitted: items.reviveContractEmitted,
    }
}

/**
 * Whether the portal answers the request with a superset of the requested items.
 */
export function needsExactFilter(req: DataRequest): boolean {
    return !!req.gearMessagesQueued?.some((r) => r.programId != null)
}

/**
 * Narrows a block down to the items of the request, with the same filter the RPC data source uses.
 *
 * The filter matches some requests on properties the portal does not return
 * (EVM log address, Gear program id, etc.), so they are derived from the item args first.
 */
export function applyRequest(block: Block, req: DataRequest): void {
    let runtime = block.header._runtime
    for (let event of block.events) {
        let e = event as any
        setEvmLog(runtime, e)
        setEmittedContractAddress(runtime, e)
        setGearProgramId(runtime, e)
        setReviveContractEmitted(runtime, e)
    }
    for (let call of block.calls) {
        setEthereumTransact(runtime, call as any)
    }
    filterBlock(block, req)
}

export function mapBlock(src: ArchiveBlock): Block {
    let block = new Block(
        new BlockHeader(assertNotNull(src.header.runtime), assertNotNull(src.header.runtimeOfPrevBlock), {
            height: src.header.number,
            ...src.header,
        }),
    )

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
