import {RequestsTracker} from '@subsquid/util-internal-ingest-tools'
import {RangeRequest} from '@subsquid/util-internal-processor-tools'
import {CallRelations, DataRequest, EventRelations} from './interfaces/data-request'
import {Block, Call, Event, Extrinsic} from './mapping'


interface Filter<T> {
    match(obj: T): boolean
}


class Requests<T, R> {
    private requests: {
        filter: Filter<T>
        relations: R
    }[] = []

    match(obj: T): R | undefined {
        let relations: R | undefined
        for (let req of this.requests) {
            if (req.filter.match(obj)) {
                relations = {...relations, ...req.relations}
            }
        }
        return relations
    }

    present(): boolean {
        return this.requests.length > 0
    }

    add(filter: FilterBuilder<T>, relations: R): void {
        if (filter.isNever()) return
        this.requests.push({
            filter: filter.build(),
            relations
        })
    }
}


class AndFilter<T> implements Filter<T> {
    constructor(private filters: Filter<T>[]) {}

    match(obj: T): boolean {
        for (let f of this.filters) {
            if (!f.match(obj)) return false
        }
        return true
    }
}


const OK: Filter<unknown> = {
    match(obj: unknown): boolean {
        return true
    }
}


class PropInFilter<T, P extends keyof T> implements Filter<T> {
    private values: Set<T[P]>

    constructor(private prop: P, values: T[P][]) {
        this.values = new Set(values)
    }

    match(obj: T): boolean {
        return this.values.has(obj[this.prop])
    }
}


class PropEqFilter<T, P extends keyof T> implements Filter<T> {
    constructor(private prop: P, private value: T[P]) {}

    match(obj: T): boolean {
        return obj[this.prop] === this.value
    }
}


class FilterBuilder<T> {
    private filters: Filter<T>[] = []
    private never = false

    propIn<P extends keyof T>(prop: P, values?: T[P][]): this {
        if (values == null) return this
        if (values.length == 0) {
            this.never = true
        }
        let filter = values.length == 1
            ? new PropEqFilter(prop, values[0])
            : new PropInFilter(prop, values)
        this.filters.push(filter)
        return this
    }

    isNever(): boolean {
        return this.never
    }

    build(): Filter<T> {
        switch(this.filters.length) {
            case 0: return OK
            case 1: return this.filters[0]
            default: return new AndFilter(this.filters)
        }
    }
}

function buildCallRequests(dataRequest: DataRequest): Requests<Call, CallRelations> {
    let requests = new Requests<Call, CallRelations>()

    dataRequest.calls?.forEach(req => {
        let {name, ...relations} = req
        let filter = new FilterBuilder<Call>()
        filter.propIn('name', name)
        requests.add(filter, relations)
    })

    dataRequest.ethereumTransactions?.forEach(req => {
        let {to, sighash, ...relations} = req
        let filter = new FilterBuilder<Call>()
        filter.propIn('_ethereumTransactTo', to)
        filter.propIn('_ethereumTransactSighash', sighash)
        requests.add(filter, relations)
    })

    return requests
}


function buildEventRequests(dataRequest: DataRequest): Requests<Event, EventRelations> {
    let requests = new Requests<Event, EventRelations>

    dataRequest.events?.forEach(req => {
        let {name, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('name', name)
        requests.add(filter, relations)
    })

    dataRequest.evmLogs?.forEach(req => {
        let {address, topic0, topic1, topic2, topic3, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('_evmLogAddress', address)
        filter.propIn('_evmLogTopic0', topic0)
        filter.propIn('_evmLogTopic1', topic1)
        filter.propIn('_evmLogTopic2', topic2)
        filter.propIn('_evmLogTopic3', topic3)
        requests.add(filter, relations)
    })

    dataRequest.contractsEvents?.forEach(req => {
        let {contractAddress, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('_contractAddress', contractAddress)
        requests.add(filter, relations)
    })

    dataRequest.gearMessagesEnqueued?.forEach(req => {
        let {programId, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('name', ['Gear.MessageEnqueued'])
        filter.propIn('_gearProgramId', programId)
        requests.add(filter, relations)
    })

    dataRequest.gearUserMessagesSent?.forEach(req => {
        let {programId, ...relations} = req
        let filter = new FilterBuilder<Event>()
        filter.propIn('name', ['Gear.UserMessageSent'])
        filter.propIn('_gearProgramId', programId)
        requests.add(filter, relations)
    })

    return requests
}


interface ItemRequests {
    events: Requests<Event, EventRelations>
    calls: Requests<Call, CallRelations>
}


const ITEM_REQUESTS = new WeakMap<DataRequest, ItemRequests>


function getItemRequests(dataRequest: DataRequest): ItemRequests {
    let items = ITEM_REQUESTS.get(dataRequest)
    if (items == null) {
        items = {
            calls: buildCallRequests(dataRequest),
            events: buildEventRequests(dataRequest)
        }
        ITEM_REQUESTS.set(dataRequest, items)
    }
    return items
}


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
    let req = getItemRequests(dataRequest)
    let include = new IncludeSet()

    if (req.events.present()) {
        for (let event of block.events) {
            let rel = req.events.match(event)
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

    if (req.calls.present()) {
        for (let call of block.calls) {
            let rel = req.calls.match(call)
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
}


export function filterBlockBatch(requests: RangeRequest<DataRequest>[], blocks: Block[]): void {
    let requestsTracker = new RequestsTracker(requests)
    for (let block of blocks) {
        let dataRequest = requestsTracker.getRequestAt(block.header.height) || {}
        filterBlock(block, dataRequest)
    }
}
