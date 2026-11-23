import {HttpClient} from '@subsquid/http-client'
import {PortalClient} from '@subsquid/portal-client'
import {RpcClient} from '@subsquid/rpc-client'
import type {RangeRequest} from '@subsquid/util-internal-range'
import {describe, expect, it} from 'vitest'
import {SubstratePortal, toPortalQuery} from './ds-portal'
import {RpcDataSource} from './ds-rpc'
import type {FieldSelection} from './interfaces/data'
import type {DataRequest} from './interfaces/data-request'
import type {Block} from './mapping'

/**
 * Live parity tests: the same block range is fetched from a portal dataset (portal source)
 * and from a chain RPC endpoint (RPC source), and the processor's blocks must be identical,
 * item for item.
 *
 * Network-gated: set `SUBSTRATE_E2E=1`. The RPC endpoints must be archive nodes,
 * runtime metadata of historical blocks is fetched from them.
 * Override endpoints with `KUSAMA_RPC`, `VARA_RPC` and `PORTAL_URL` (portal base URL).
 */

const ENABLED = process.env.SUBSTRATE_E2E === '1'
const PORTAL_URL = process.env.PORTAL_URL || 'https://portal.sqd.dev'
const KUSAMA_RPC = process.env.KUSAMA_RPC || 'https://kusama-rpc.polkadot.io'
const VARA_RPC = process.env.VARA_RPC || 'https://archive-rpc.vara.network'

const ALL_FIELDS: FieldSelection = {
    block: {timestamp: true, digest: true, stateRoot: true, extrinsicsRoot: true, validator: true},
    event: {name: true, args: true, phase: true, topics: true},
    call: {name: true, args: true, success: true, origin: true, error: true},
    extrinsic: {hash: true, fee: true, tip: true, success: true, error: true, signature: true, version: true},
}

function portalSource(dataset: string, rpc: RpcClient) {
    return new SubstratePortal({
        client: new PortalClient({url: `${PORTAL_URL}/datasets/${dataset}`, http: new HttpClient({retryAttempts: 50})}),
        rpc,
    })
}

function rpcClient(url: string) {
    return new RpcClient({url, capacity: 5, rateLimit: 15, retryAttempts: 10, requestTimeout: 30_000})
}

async function collect(
    src: {getFinalizedBlocks: SubstratePortal['getFinalizedBlocks']},
    req: RangeRequest<DataRequest>,
) {
    let blocks: Block[] = []
    for await (let batch of src.getFinalizedBlocks([req], true)) {
        blocks.push(...batch.blocks)
    }
    return blocks
}

const json = (v: unknown) => JSON.parse(JSON.stringify(v ?? null, (_k, x) => (typeof x == 'bigint' ? x.toString() : x)))

function normalize(b: Block) {
    let {header: h} = b
    return {
        height: h.height,
        hash: h.hash,
        parentHash: h.parentHash,
        timestamp: h.timestamp,
        spec: [h.specName, h.specVersion, h.implName, h.implVersion],
        digest: json(h.digest),
        stateRoot: h.stateRoot,
        extrinsicsRoot: h.extrinsicsRoot,
        validator: h.validator,
        events: b.events.map((e) =>
            json([
                e.id,
                e.name,
                e.phase,
                e.extrinsicIndex,
                e.callAddress,
                e.args,
                e.topics,
                e.extrinsic?.id,
                e.call?.id,
            ]),
        ),
        calls: b.calls.map((c) =>
            json([c.id, c.name, c.args, c.success, c.origin, c.error, c.extrinsic?.id, c.parentCall?.id]),
        ),
        extrinsics: b.extrinsics.map((x) =>
            json([x.id, x.version, x.hash, x.fee, x.tip, x.success, x.error, x.signature, x.call?.id]),
        ),
    }
}

function hasItems(b: Block) {
    return b.events.length + b.calls.length + b.extrinsics.length > 0
}

/**
 * The RPC source returns every block of the range, the portal only blocks with items
 * (plus range boundaries). Both must agree on every block they both return,
 * and the portal must return every block in which the RPC source found items.
 */
async function assertParity(portal: SubstratePortal, rpc: RpcDataSource, req: RangeRequest<DataRequest>) {
    let [p, r] = await Promise.all([collect(portal, req), collect(rpc, req)])
    let rpcByHeight = new Map(r.map((b) => [b.header.height, b]))
    let portalHeights = new Set(p.map((b) => b.header.height))

    for (let b of r) {
        if (hasItems(b)) expect(portalHeights.has(b.header.height), `block ${b.header.height}`).toBe(true)
    }
    for (let b of p) {
        let other = rpcByHeight.get(b.header.height)
        expect(other, `block ${b.header.height}`).toBeDefined()
        expect(normalize(b)).toEqual(normalize(other!))
    }
    return {
        blocks: p.filter(hasItems).length,
        events: p.reduce((s, b) => s + b.events.length, 0),
        calls: p.reduce((s, b) => s + b.calls.length, 0),
    }
}

describe.skipIf(!ENABLED)('portal vs RPC parity', () => {
    it('kusama: events and calls with all fields', {timeout: 600_000}, async () => {
        let rpc = rpcClient(KUSAMA_RPC)
        let res = await assertParity(portalSource('kusama', rpc), new RpcDataSource({rpc}), {
            range: {from: 36_100_000, to: 36_100_100},
            request: {
                fields: ALL_FIELDS,
                events: [
                    {name: ['System.ExtrinsicSuccess', 'ParaInclusion.CandidateIncluded'], extrinsic: true, call: true},
                ],
                calls: [{name: ['Timestamp.set', 'ParaInherent.enter'], extrinsic: true, events: true}],
            },
        })
        expect(res.events).toBeGreaterThan(1000)
        expect(res.calls).toBeGreaterThan(100)
    })

    it('vara: gear MessageQueued filtered by program id', {timeout: 600_000}, async () => {
        let rpc = rpcClient(VARA_RPC)
        let res = await assertParity(portalSource('vara', rpc), new RpcDataSource({rpc}), {
            range: {from: 37_000_000, to: 37_002_000},
            request: {
                fields: ALL_FIELDS,
                gearMessagesQueued: [
                    {
                        programId: ['0xa749ccd80d71637b450789e12e3d94524e9ae17877d1b59f5ddda784f89a2cba'],
                        extrinsic: true,
                        call: true,
                    },
                ],
                calls: [{name: ['Gear.send_reply'], events: true}],
            },
        })
        // the portal returns 27 Gear.MessageQueued events in this range, 3 of them for the program
        expect(res.events).toBeGreaterThanOrEqual(3)
    })

    it('vara: gear MessageQueued filtered by program id in early blocks', {timeout: 600_000}, async () => {
        // Archived blocks this old do not carry the program id the portal filters on,
        // so a server-side program id filter would silently return nothing here.
        // They do not store event topics either, so items are compared without them.
        let rpc = rpcClient(VARA_RPC)
        let req: RangeRequest<DataRequest> = {
            range: {from: 9_300_000, to: 9_300_300},
            request: {
                fields: {event: {name: true, args: true}, extrinsic: {hash: true}},
                gearMessagesQueued: [
                    {
                        programId: ['0x91282a7344c498560810d991c42aee5f9ef5a5b7002646a0421fdf29d4f4783e'],
                        extrinsic: true,
                    },
                ],
            },
        }
        let items = (blocks: Block[]) =>
            blocks.flatMap((b) => b.events.map((e) => json([e.id, e.name, e.args, e.extrinsic?.hash])))
        let [p, r] = await Promise.all([
            collect(portalSource('vara', rpc), req),
            collect(new RpcDataSource({rpc}), req),
        ])
        // 597 Gear.MessageQueued events in this range, 34 of them for the program
        expect(items(p)).toHaveLength(34)
        expect(items(p)).toEqual(items(r))
    })
})

describe.skipIf(!ENABLED)('portal accepts every request the processor sends', () => {
    let cases: [string, number, DataRequest][] = [
        [
            'astar-substrate',
            4_021_130,
            {events: [{name: ['Balances.Transfer'], extrinsic: true, call: true, stack: true}]},
        ],
        [
            'astar-substrate',
            4_021_130,
            {calls: [{name: ['Ethereum.transact'], extrinsic: true, stack: true, events: true}]},
        ],
        [
            'astar-substrate',
            4_021_130,
            {evmLogs: [{address: ['0x6a2d262d56735dba19dd70682b39f6be9a931d98'], topic0: ['0x00'], extrinsic: true}]},
        ],
        [
            'astar-substrate',
            4_021_130,
            {
                ethereumTransactions: [
                    {to: ['0x6a2d262d56735dba19dd70682b39f6be9a931d98'], sighash: ['0x00'], events: true},
                ],
            },
        ],
        ['astar-substrate', 4_021_130, {contractsEvents: [{contractAddress: ['0x00'], extrinsic: true}]}],
        ['astar-substrate', 4_021_130, {includeAllBlocks: true}],
        ['vara', 37_000_000, {gearMessagesQueued: [{programId: ['0x00'], extrinsic: true}]}],
        ['vara', 37_000_000, {gearUserMessagesSent: [{programId: ['0x00'], extrinsic: true}]}],
        [
            'asset-hub-polkadot',
            23_000_000,
            {reviveContractEmitted: [{contract: ['0x00'], topic0: ['0x00'], extrinsic: true}]},
        ],
    ]

    for (let [dataset, from, request] of cases) {
        it(`${dataset}: ${Object.keys(request).join(', ')}`, {timeout: 120_000}, async () => {
            let client = new PortalClient({
                url: `${PORTAL_URL}/datasets/${dataset}`,
                http: new HttpClient({retryAttempts: 50}),
            })
            let query = toPortalQuery({range: {from, to: from + 50}, request})
            let blocks = 0
            for await (let batch of client.getFinalizedStream(query)) {
                blocks += batch.blocks.length
            }
            // range boundaries are always returned
            expect(blocks).toBeGreaterThanOrEqual(2)
        })
    }
})
