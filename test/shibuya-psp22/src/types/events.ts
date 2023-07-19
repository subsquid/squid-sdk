import assert from 'assert'
import {Runtime, ChainContext, EventContext, Event, Result, Option} from './support'

export class ContractsContractEmittedEvent {
    private readonly runtime: Runtime
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        this.runtime = ctx._chain.runtime
        this.event = event || ctx.event
        assert(this.event.name === 'Contracts.ContractEmitted')
    }

    /**
     * A custom event emitted by the contract.
     */
    get isV31(): boolean {
        return this.runtime.getEventTypeHash('Contracts.ContractEmitted') === '7f28393268795b9a97f05e82911cdcc4200d99e9968c1ab6a564f949f753b929'
    }

    /**
     * A custom event emitted by the contract.
     */
    get asV31(): {contract: Uint8Array, data: Uint8Array} {
        assert(this.isV31)
        return this.runtime.decodeJsonEvent(this.event)
    }
}
