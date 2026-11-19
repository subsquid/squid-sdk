import type {PortalClient, substrate as portal} from '@subsquid/portal-client'
import type {RpcClient} from '@subsquid/rpc-client'
import {Rpc, RuntimeTracker, type WithRuntime} from '@subsquid/substrate-data'
import type {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {annotateSyncError, assertNotNull, last, wait} from '@subsquid/util-internal'
import {assertIsValid, type IsInvalid} from '@subsquid/util-internal-ingest-tools'
import type {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import type {RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {DEFAULT_FIELDS, type FieldSelection} from './interfaces/data'
import type {ArchiveBlock, ArchiveBlockHeader, ArchiveEvent} from './interfaces/data-partial'
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

    constructor(options: SubstratePortalOptions) {
        this.client = options.client
        this.rpc = new Rpc(options.rpc)
        this.typesBundle = options.typesBundle
        this.headers = options.headers
        this.headPollInterval = options.headPollInterval ?? 5_000
    }

    async getFinalizedHeight(): Promise<number> {
        let head = await this.client.getFinalizedHead({headers: this.headers})
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
            let postFilter = getPostFilter(req.request)

            while (beg <= end) {
                let head = await this.getFinalizedHeight()
                if (head < beg) {
                    if (stopOnHead) return
                    await wait(this.headPollInterval)
                    continue
                }

                let query = toPortalQuery({range: {from: beg, to: req.range.to}, request: req.request})

                for await (let {blocks: batch, meta} of this.client.getFinalizedStream(query, {
                    request: {headers: this.headers},
                })) {
                    if (meta.finalizedHeadNumber != null) {
                        head = Math.max(head, meta.finalizedHeadNumber)
                    }

                    // The stream reports head updates without data,
                    // stop on them once we've seen everything the portal has.
                    if (batch.length == 0) {
                        if (beg > head) break
                        continue
                    }

                    let blocks = batch as unknown as ArchiveBlock[]
                    let lastBlock = last(blocks).header.number
                    assert(lastBlock >= beg)
                    beg = lastBlock + 1

                    let headers: (ArchiveBlockHeader & IsInvalid)[] = blocks.map((b) => b.header)
                    await runtimeTracker.setRuntime(headers)
                    assertIsValid(headers)

                    let isHead = beg > head

                    yield {
                        blocks: blocks.map((b) => this.mapBlock(postFilter ? postFilter(b) : b)),
                        isHead,
                    }

                    // Leave the stream at the head, the outer loop
                    // decides whether to stop or to wait for new blocks.
                    if (isHead) break
                }
            }
        }
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
export function getFields(fields: FieldSelection | undefined, needEventArgs?: boolean): portal.FieldSelection {
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
        }),
        event: mergeFields<any>(DEFAULT_FIELDS.event, fields?.event, {
            index: true,
            extrinsicIndex: true,
            callAddress: true,
            ...(needEventArgs ? {name: true, args: true} : undefined),
        }),
    }
}

const GEAR_MESSAGE_QUEUED = 'Gear.MessageQueued'

/**
 * Maps a processor data request to a portal query.
 *
 * `gearMessagesQueued` requests are sent as plain `Gear.MessageQueued` event requests:
 * the portal's own `gearMessagesEnqueued` request matches `Gear.UserMessageEnqueued`
 * events instead. Program id filtering is then applied on the client by {@link getPostFilter}.
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
        fields: getFields(fields, needsGearPostFilter(req.request)),
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

function needsGearPostFilter(req: DataRequest): boolean {
    return getGearProgramIds(req) != null
}

/**
 * Returns the set of program ids `Gear.MessageQueued` events have to be restricted to,
 * or `undefined` when all `Gear.MessageQueued` events the portal returns were asked for.
 */
function getGearProgramIds(req: DataRequest): Set<string> | undefined {
    if (!req.gearMessagesQueued?.length) return
    if (req.gearMessagesQueued.some((r) => r.programId == null)) return
    // other requests may legitimately select `Gear.MessageQueued` events
    if (req.events?.some((r) => r.name == null || r.name.includes(GEAR_MESSAGE_QUEUED))) return
    let ids = new Set<string>()
    for (let r of req.gearMessagesQueued) {
        for (let id of r.programId!) {
            ids.add(id.toLowerCase())
        }
    }
    return ids
}

export function getPostFilter(req: DataRequest): ((block: ArchiveBlock) => ArchiveBlock) | undefined {
    let programIds = getGearProgramIds(req)
    if (programIds == null) return
    return (block) => {
        if (!block.events?.length) return block
        return {
            ...block,
            events: block.events.filter((e) => isWantedEvent(e, programIds)),
        }
    }
}

function isWantedEvent(e: ArchiveEvent, gearProgramIds: Set<string>): boolean {
    if (e.name != GEAR_MESSAGE_QUEUED) return true
    let destination = (e.args as any)?.destination
    return typeof destination == 'string' && gearProgramIds.has(destination.toLowerCase())
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
