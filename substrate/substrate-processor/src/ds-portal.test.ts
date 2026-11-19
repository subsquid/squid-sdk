import {describe, expect, it} from 'vitest'
import {getPostFilter, toPortalQuery} from './ds-portal'
import type {ArchiveBlock} from './interfaces/data-partial'
import type {DataRequest} from './interfaces/data-request'

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

function block(events: {name: string; destination?: string}[]): ArchiveBlock {
    return {
        header: {number: 1, hash: '0x01', parentHash: '0x00'} as any,
        events: events.map((e, index) => ({
            index,
            extrinsicIndex: 0,
            callAddress: [],
            name: e.name,
            args: e.destination == null ? undefined : {destination: e.destination},
        })) as any,
    }
}

describe('getPostFilter', () => {
    it('is not needed without gear MessageQueued requests', () => {
        expect(getPostFilter({events: [{name: ['Gear.MessageQueued']}]})).toBeUndefined()
    })

    it('is not needed when all MessageQueued events were asked for', () => {
        expect(getPostFilter({gearMessagesQueued: [{}]})).toBeUndefined()
        expect(getPostFilter({gearMessagesQueued: [{programId: ['0x01']}, {}]})).toBeUndefined()
        expect(
            getPostFilter({
                gearMessagesQueued: [{programId: ['0x01']}],
                events: [{name: ['Gear.MessageQueued']}],
            }),
        ).toBeUndefined()
        expect(
            getPostFilter({
                gearMessagesQueued: [{programId: ['0x01']}],
                events: [{}],
            }),
        ).toBeUndefined()
    })

    it('drops MessageQueued events of other programs', () => {
        let filter = getPostFilter({
            gearMessagesQueued: [{programId: ['0xAA']}, {programId: ['0xbb']}],
            events: [{name: ['Balances.Transfer']}],
        })!
        expect(filter).toBeDefined()
        let res = filter(
            block([
                {name: 'Gear.MessageQueued', destination: '0xaa'},
                {name: 'Gear.MessageQueued', destination: '0xcc'},
                {name: 'Gear.MessageQueued', destination: '0xBB'},
                {name: 'Balances.Transfer'},
                {name: 'Gear.MessageQueued'},
            ]),
        )
        expect(res.events!.map((e) => [e.name, (e.args as any)?.destination])).toEqual([
            ['Gear.MessageQueued', '0xaa'],
            ['Gear.MessageQueued', '0xBB'],
            ['Balances.Transfer', undefined],
        ])
    })
})
