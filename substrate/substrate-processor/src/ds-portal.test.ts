import {describe, expect, it, vi} from 'vitest'
import {applyRequest, mapBlock, needsExactFilter, SubstratePortal, toPortalQuery} from './ds-portal'
import type {ArchiveBlock} from './interfaces/data-partial'
import type {DataRequest} from './interfaces/data-request'

// The real setter checks event types against the runtime metadata
vi.mock('@subsquid/substrate-data/lib/extension/gear', () => ({
    setGearProgramId(_runtime: unknown, event: any) {
        if (event.name == 'Gear.MessageQueued') {
            event._gearProgramId = event.args.destination
        }
    },
}))

function query(request: DataRequest, range = {from: 10, to: 20}) {
    return toPortalQuery({range, request})
}

describe('toPortalQuery', () => {
    it('always requests the fields the processor relies on', () => {
        let q = query({events: [{name: ['Balances.Transfer']}]})
        expect(q.type).toBe('substrate')
        expect(q.fromBlock).toBe(10)
        expect(q.toBlock).toBe(20)
        expect(q.fields?.block).toMatchObject({
            parentHash: true,
            specName: true,
            specVersion: true,
            implName: true,
            implVersion: true,
        })
        expect(q.fields?.extrinsic).toMatchObject({index: true})
        expect(q.fields?.call).toMatchObject({extrinsicIndex: true, address: true, name: true, args: true})
        expect(q.fields?.event).toMatchObject({
            index: true,
            extrinsicIndex: true,
            callAddress: true,
            name: true,
            args: true,
        })
    })

    it('keeps the requested fields, required ones can not be turned off', () => {
        let q = query({
            fields: {
                block: {timestamp: true},
                event: {args: false},
                extrinsic: {hash: true, fee: true},
            },
            events: [{}],
        })
        expect(q.fields?.block).toMatchObject({timestamp: true, parentHash: true})
        expect(q.fields?.event).toMatchObject({args: false, name: true, index: true})
        expect(q.fields?.extrinsic).toMatchObject({hash: true, fee: true, index: true})
    })

    it('leaves the upper bound open for open ranges', () => {
        let q = query({includeAllBlocks: true}, {from: 5} as any)
        expect(q.fromBlock).toBe(5)
        expect(q.toBlock).toBeUndefined()
        expect(q.includeAllBlocks).toBe(true)
    })

    it('passes item requests through under the names the portal accepts', () => {
        let request: DataRequest = {
            calls: [{name: ['Balances.transfer'], events: true}],
            evmLogs: [{address: ['0xaa'], topic0: ['0x01']}],
            ethereumTransactions: [{to: ['0xbb'], sighash: ['0x12345678']}],
            contractsEvents: [{contractAddress: ['0xcc']}],
            gearUserMessagesSent: [{programId: ['0xdd']}],
            reviveContractEmitted: [{contract: ['0xee'], topic1: ['0x02']}],
        }
        let q = query(request)
        expect(q.calls).toEqual(request.calls)
        expect(q.evmLogs).toEqual(request.evmLogs)
        expect(q.ethereumTransactions).toEqual(request.ethereumTransactions)
        expect(q.contractsEvents).toEqual(request.contractsEvents)
        expect(q.gearUserMessagesSent).toEqual(request.gearUserMessagesSent)
        expect(q.reviveContractEmitted).toEqual(request.reviveContractEmitted)
        expect(q).not.toHaveProperty('fields.event.topics')
    })

    it('maps gear MessageQueued requests to plain event requests', () => {
        let q = query({
            events: [{name: ['Balances.Transfer']}],
            gearMessagesQueued: [{programId: ['0xAB'], extrinsic: true}],
        })
        expect(q).not.toHaveProperty('gearMessagesQueued')
        expect(q).not.toHaveProperty('gearMessagesEnqueued')
        expect(q.events).toEqual([{name: ['Balances.Transfer']}, {name: ['Gear.MessageQueued'], extrinsic: true}])
        // program id is filtered on the client, which needs the event args
        expect(q.fields?.event).toMatchObject({name: true, args: true})
    })
})

interface TestExtrinsic {
    index: number
    call?: string
    events: {name: string; destination?: string}[]
}

/**
 * A block where every extrinsic has one root call and the given events emitted by that call.
 */
function block(extrinsics: TestExtrinsic[]): ArchiveBlock {
    let index = 0
    return {
        header: {number: 1, hash: '0x01', parentHash: '0x00', runtime: {}, runtimeOfPrevBlock: {}} as any,
        extrinsics: extrinsics.map((ex) => ({index: ex.index})),
        calls: extrinsics.map((ex) => ({
            extrinsicIndex: ex.index,
            address: [],
            name: ex.call ?? 'Gear.send_message',
            args: {},
        })) as any,
        events: extrinsics.flatMap((ex) =>
            ex.events.map((e) => ({
                index: index++,
                extrinsicIndex: ex.index,
                callAddress: [],
                phase: 'ApplyExtrinsic',
                name: e.name,
                args: e.destination == null ? {} : {destination: e.destination},
            })),
        ) as any,
    }
}

function filtered(src: ArchiveBlock, req: DataRequest) {
    let b = mapBlock(src)
    applyRequest(b, req)
    return {
        events: b.events.map((e) => [e.name, e.args.destination ?? null]),
        calls: b.calls.map((c) => c.extrinsicIndex),
        extrinsics: b.extrinsics.map((x) => x.index),
    }
}

describe('needsExactFilter', () => {
    it('is only needed for gear MessageQueued requests with program ids', () => {
        expect(needsExactFilter({events: [{name: ['Gear.MessageQueued']}]})).toBe(false)
        expect(needsExactFilter({gearMessagesQueued: [{}]})).toBe(false)
        expect(needsExactFilter({gearMessagesQueued: [{}, {programId: ['0xaa']}]})).toBe(true)
    })

    it('requests the names and args the client side filter inspects', () => {
        let q = query({
            gearMessagesQueued: [{programId: ['0xaa']}],
            fields: {event: {args: false}, call: {name: false}},
        })
        expect(q.fields?.event).toMatchObject({name: true, args: true})
        expect(q.fields?.call).toMatchObject({name: true, args: true})
    })
})

describe('applyRequest', () => {
    it('drops MessageQueued events of other programs', () => {
        let res = filtered(
            block([
                {index: 0, events: [{name: 'Gear.MessageQueued', destination: '0xaa'}]},
                {index: 1, events: [{name: 'Gear.MessageQueued', destination: '0xcc'}]},
                {index: 2, events: [{name: 'Gear.MessageQueued', destination: '0xbb'}, {name: 'Balances.Transfer'}]},
            ]),
            {
                gearMessagesQueued: [{programId: ['0xaa']}, {programId: ['0xbb']}],
                events: [{name: ['Balances.Transfer']}],
            },
        )
        expect(res.events).toEqual([
            ['Gear.MessageQueued', '0xaa'],
            ['Gear.MessageQueued', '0xbb'],
            ['Balances.Transfer', null],
        ])
    })

    it('keeps MessageQueued events selected by other requests', () => {
        let res = filtered(
            block([
                {index: 0, events: [{name: 'Gear.MessageQueued', destination: '0xaa'}]},
                {index: 1, call: 'Gear.send_reply', events: [{name: 'Gear.MessageQueued', destination: '0xbb'}]},
                {index: 2, events: [{name: 'Gear.MessageQueued', destination: '0xcc'}]},
            ]),
            {
                gearMessagesQueued: [{programId: ['0xaa']}],
                calls: [{name: ['Gear.send_reply'], events: true}],
            },
        )
        expect(res.events).toEqual([
            ['Gear.MessageQueued', '0xaa'],
            ['Gear.MessageQueued', '0xbb'],
        ])
        expect(res.calls).toEqual([1])
    })

    it('drops relations fetched only for the rejected events', () => {
        let res = filtered(
            block([
                {index: 0, events: [{name: 'Gear.MessageQueued', destination: '0xbb'}]},
                {index: 1, events: [{name: 'Gear.MessageQueued', destination: '0xaa'}]},
            ]),
            {gearMessagesQueued: [{programId: ['0xaa'], extrinsic: true, call: true}]},
        )
        expect(res.events).toEqual([['Gear.MessageQueued', '0xaa']])
        expect(res.extrinsics).toEqual([1])
        expect(res.calls).toEqual([1])
    })
})

describe('SubstratePortal', () => {
    it('passes the retry budget, zero included, with every request', async () => {
        let seen: any[] = []
        let heads = [5, 5, 2]
        let client = {
            async getFinalizedHead(options: any) {
                seen.push(options)
                let number = heads.shift()!
                return {number, hash: '0x00'}
            },
            getFinalizedStream(_query: any, options: any) {
                seen.push(options.request)
                return (async function* () {})()
            },
        }
        let src = new SubstratePortal({
            client: client as any,
            rpc: {} as any,
            headers: {'x-squid-id': 'test'},
            retryAttempts: 0,
            headPollInterval: 1,
        })
        expect(await src.getFinalizedHeight()).toBe(5)
        // head 5 >= 3: stream, which ends without data; then head 2 < 3: stop
        for await (let _ of src.getFinalizedBlocks([{range: {from: 3}, request: {}}], true)) {
        }
        let opts = {headers: {'x-squid-id': 'test'}, retryAttempts: 0}
        expect(seen).toEqual([opts, opts, opts, opts])
    })
})
