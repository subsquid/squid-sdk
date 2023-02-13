import assert from 'assert'
import {Chain, ChainContext, EventContext, Event, Result, Option} from './support'
import * as v1 from './v1'
import * as v9 from './v9'
import * as v15 from './v15'
import * as v23 from './v23'
import * as v30 from './v30'
import * as v33 from './v33'
import * as v43 from './v43'

export class EthereumExecutedEvent {
    private readonly _chain: Chain
    private readonly event: Event

    constructor(ctx: EventContext)
    constructor(ctx: ChainContext, event: Event)
    constructor(ctx: EventContext, event?: Event) {
        event = event || ctx.event
        assert(event.name === 'Ethereum.Executed')
        this._chain = ctx._chain
        this.event = event
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get isV1(): boolean {
        return this._chain.getEventHash('Ethereum.Executed') === '0c7eb5ef81fb6e87c05b96ed25f52c62fffc067198343642f01289fbb0011fce'
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get asV1(): [Uint8Array, Uint8Array, Uint8Array, v1.ExitReason] {
        assert(this.isV1)
        return this._chain.decodeEvent(this.event)
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get isV9(): boolean {
        return this._chain.getEventHash('Ethereum.Executed') === '4548a1e2cc89d3c4c1d89f3020a6fb505032fdfd5236d5749c897815fb7db5de'
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get asV9(): [Uint8Array, Uint8Array, Uint8Array, v9.ExitReason] {
        assert(this.isV9)
        return this._chain.decodeEvent(this.event)
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get isV15(): boolean {
        return this._chain.getEventHash('Ethereum.Executed') === '19a41316cbc97760af789cb1da772172d6a9f09521ee0e5e8f18125c1db318df'
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get asV15(): [Uint8Array, Uint8Array, Uint8Array, v15.ExitReason] {
        assert(this.isV15)
        return this._chain.decodeEvent(this.event)
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get isV23(): boolean {
        return this._chain.getEventHash('Ethereum.Executed') === '42c632fb85f0ab54f0811a41be276501476d6d3e1e0169c6a6db6afdd63e7893'
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get asV23(): [Uint8Array, Uint8Array, Uint8Array, v23.ExitReason] {
        assert(this.isV23)
        return this._chain.decodeEvent(this.event)
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get isV30(): boolean {
        return this._chain.getEventHash('Ethereum.Executed') === '19a41316cbc97760af789cb1da772172d6a9f09521ee0e5e8f18125c1db318df'
    }

    /**
     * An ethereum transaction was successfully executed. [from, to/contract_address, transaction_hash, exit_reason]
     */
    get asV30(): [Uint8Array, Uint8Array, Uint8Array, v30.ExitReason] {
        assert(this.isV30)
        return this._chain.decodeEvent(this.event)
    }

    /**
     * An ethereum transaction was successfully executed.
     */
    get isV33(): boolean {
        return this._chain.getEventHash('Ethereum.Executed') === 'ce346fb50a61fef1951414eeed890a5d893f46ed58612b042507511dc1cf16f1'
    }

    /**
     * An ethereum transaction was successfully executed.
     */
    get asV33(): {from: Uint8Array, to: Uint8Array, transactionHash: Uint8Array, exitReason: v33.ExitReason} {
        assert(this.isV33)
        return this._chain.decodeEvent(this.event)
    }

    /**
     * An ethereum transaction was successfully executed.
     */
    get isV43(): boolean {
        return this._chain.getEventHash('Ethereum.Executed') === '85a0045758a84a2cd09a563b9e9fc2194e6054385c70290178792fb71cd20021'
    }

    /**
     * An ethereum transaction was successfully executed.
     */
    get asV43(): {from: Uint8Array, to: Uint8Array, transactionHash: Uint8Array, exitReason: v43.ExitReason} {
        assert(this.isV43)
        return this._chain.decodeEvent(this.event)
    }
}
