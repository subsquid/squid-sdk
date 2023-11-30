import {weakMemo} from '@subsquid/util-internal'
import {EntityFilter, FilterBuilder} from '@subsquid/util-internal-processor-tools'
import {getRequestAt, RangeRequest} from '@subsquid/util-internal-range'
import {CallRelations, DataRequest, EventRelations} from './interfaces/data-request'
import {Block, Call, Event, Extrinsic} from './mapping'


function buildCallFilter(dataRequest: DataRequest): EntityFilter<Call, CallRelations> {
    let calls = new EntityFilter<Call, CallRelations>()

    dataRequest.calls?.forEach(req => {
        let {name, ...relations} = req
        let filter = new FilterBuilder<Call>()
        filter.propIn('name', name)
        calls.add(filter, relations)
    })

    dataRequest.ethereumTransactions?.forEach(req => {
        let {to, sighash, ...relations} = req
        let filter = new FilterBuilder<Call>()
        filter.propIn('_ethereumTransactTo', to)
        filter.propIn('_ethereumTransactSighash', sighash)
        calls.add(filter, relations)
    })

    return calls
}


function buildEventFilter(dataRequest: DataRequest): EntityFilter<Event, EventRelations> {
    let events = new EntityFilter<Event, EventRelations>

    dataRequest.events?.forEach(req => {
        let {name, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('name', name)
        events.add(filter, relations)
    })

    dataRequest.evmLogs?.forEach(req => {
        let {address, topic0, topic1, topic2, topic3, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('_evmLogAddress', address)
        filter.propIn('_evmLogTopic0', topic0)
        filter.propIn('_evmLogTopic1', topic1)
        filter.propIn('_evmLogTopic2', topic2)
        filter.propIn('_evmLogTopic3', topic3)
        events.add(filter, relations)
    })

    dataRequest.contractsEvents?.forEach(req => {
        let {contractAddress, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('_contractAddress', contractAddress)
        events.add(filter, relations)
    })

    dataRequest.gearMessagesQueued?.forEach(req => {
        let {programId, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('name', ['Gear.MessageQueued'])
        filter.propIn('_gearProgramId', programId)
        events.add(filter, relations)
    })

    dataRequest.gearUserMessagesSent?.forEach(req => {
        let {programId, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('name', ['Gear.UserMessageSent'])
        filter.propIn('_gearProgramId', programId)
        events.add(filter, relations)
    })

    return events
}


const getItemFilter = weakMemo((dataRequest: DataRequest) => {
    return {
        calls: buildCallFilter(dataRequest),
        events: buildEventFilter(dataRequest)
    }
})


class IncludeSet {
    public readonly events = new Set<Event>()
    public readonly calls = new Set<Call>()
    public readonly extrinsics = new Set<Extrinsic>()

    addEvent(event?: Event): void {
        if (event) {
            this.events.add(event)
        }
    }

    addCall(call?: Call): void {
        if (call) {
            this.calls.add(call)
        }
    }

    addExtrinsic(extrinsic?: Extrinsic): void {
        if (extrinsic) {
            this.extrinsics.add(extrinsic)
        }
    }

    addCallStack(call?: Call): void {
        while (call) {
            this.calls.add(call)
            call = call.parentCall
        }
    }
}


function filterBlock(block: Block, dataRequest: DataRequest): void {
    let items = getItemFilter(dataRequest)

    let include = new IncludeSet()

    if (items.events.present()) {
        for (let event of block.events) {
            let rel = items.events.match(event)
            if (rel == null) continue
            include.addEvent(event)
            if (rel.stack) {
                include.addCallStack(event.call)
            } else if (rel.call) {
                include.addCall(event.call)
            }
            if (rel.extrinsic) {
                include.addExtrinsic(event.extrinsic)
            }
        }
    }

    if (items.calls.present()) {
        for (let call of block.calls) {
            let rel = items.calls.match(call)
            if (rel == null) continue
            include.addCall(call)
            if (rel.events) {
                for (let event of call.events) {
                    include.addEvent(event)
                }
            }
            if (rel.stack) {
                include.addCallStack(call.parentCall)
            }
            if (rel.extrinsic) {
                include.addExtrinsic(call.extrinsic)
            }
        }
    }

    block.events = block.events.filter(event => {
        if (!include.events.has(event)) return false
        if (event.call && !include.calls.has(event.call)) {
            event.call = undefined
        }
        if (event.extrinsic && !include.extrinsics.has(event.extrinsic)) {
            event.extrinsic = undefined
        }
        return true
    })

    block.calls = block.calls.filter(call => {
        if (!include.calls.has(call)) return false
        if (call.parentCall && !include.calls.has(call.parentCall)) {
            call.parentCall = undefined
        }
        if (call.extrinsic && !include.extrinsics.has(call.extrinsic)) {
            call.extrinsic = undefined
        }
        call.subcalls = call.subcalls.filter(sub => include.calls.has(sub))
        call.events = call.events.filter(event => include.events.has(event))
        return true
    })

    block.extrinsics = block.extrinsics.filter(ex => {
        if (!include.extrinsics.has(ex)) return false
        if (ex.call && !include.calls.has(ex.call)) {
            ex.call = undefined
        }
        ex.subcalls = ex.subcalls.filter(sub => include.calls.has(sub))
        ex.events = ex.events.filter(event => include.events.has(event))
        return true
    })
}


export function filterBlockBatch(requests: RangeRequest<DataRequest>[], blocks: Block[]): void {
    for (let block of blocks) {
        let dataRequest = getRequestAt(requests, block.header.height) || NO_DATA_REQUEST
        filterBlock(block, dataRequest)
    }
}


const NO_DATA_REQUEST: DataRequest = {}
