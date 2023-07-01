import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {Call, Event, Extrinsic} from '../interfaces/data'
import {Result} from '../interfaces/data-decoded'
import * as decoded from '../interfaces/data-decoded'
import type {BlockParser} from './block'
import {addressOrigin, getExtrinsicFailedError, rootOrigin, signedOrigin} from './util'


type Boundary<T> = (event: Event) => T | undefined | null | false


export class CallParser {
    public readonly calls: Call[] = []
    private eventPos: number
    private extrinsic!: Extrinsic
    private address?: number[]
    private boundary?: Boundary<unknown>

    constructor(
        private bp: BlockParser,
        private extrinsics: {extrinsic: Extrinsic, call: Call}[],
        private events: Event[]
    ) {
        this.eventPos = events.length - 1
    }

    parse(): void {
        for (let i = this.extrinsics.length - 1; i >= 0; i--) {
            this.extrinsic = this.extrinsics[i].extrinsic
            let call = this.extrinsics[i].call
            let event = this.next()
            switch(event.name) {
                case 'System.ExtrinsicSuccess':
                    this.extrinsic.success = true
                    this.visitCall(call)
                    break
                case 'System.ExtrinsicFailed':
                    let err = getExtrinsicFailedError(event.args)
                    this.extrinsic.success = false
                    this.extrinsic.error = err
                    this.visitFailedCall(call, err)
                    break
                default:
                    throw unexpectedCase(event.name)
            }
        }
    }

    private visitCall(call: Call): void {
        call.success = true
        this.calls.push(call)

        let parentAddress = this.address
        this.address = call.address

        switch(call.name) {
            case 'Multisig.as_multi':
                this.unwrapAsMulti(call)
                break
            case 'Multisig.as_multi_threshold_1':
                // FIXME: compute origin
                this.visitCall(this.getSubcall(call, null))
                break
            case 'Utility.batch':
                this.unwrapBatch(call)
                break
            case 'Utility.batch_all':
                this.unwrapBatchAll(call)
                break
            case 'Utility.force_batch':
                this.unwrapForceBatch(call)
                break
            case 'Utility.dispatch_as':
                this.unwrapDispatchAs(call)
                break
            case 'Utility.as_derivative':
            case 'Utility.as_sub':
            case 'Utility.as_limited_sub':
                // FIXME: compute origin
                this.visitCall(this.getSubcall(call, null))
                break
            case 'Proxy.proxy':
            case 'Proxy.proxy_announced':
                this.unwrapProxy(call)
                break
            case 'Sudo.sudo':
            case 'Sudo.sudo_unchecked_weight':
                this.unwrapSudo(call)
                break
            case 'Sudo.sudo_as':
                this.unwrapSudoAs(call)
                break
        }

        this.takeEvents()
        this.address = parentAddress
    }

    private unwrapAsMulti(call: Call): void {
        if (!this.lookup(MULTISIG_EXECUTED)) return
        let result = this.get(MULTISIG_EXECUTED)
        let rawSub: Uint8Array | decoded.Call = call.args.call
        if (rawSub instanceof Uint8Array) {
            rawSub = this.bp.runtime.decodeCall(rawSub)
        }
        let sub = this.bp.createCall(
            call.extrinsicIndex,
            call.address.concat([0]),
            rawSub,
            addressOrigin(result.multisig)
        )
        if (result.ok) {
            this.visitCall(sub)
        } else {
            this.visitFailedCall(sub, result.error)
        }
    }

    private unwrapBatch(call: Call): void {
        let items = this.getSubcalls(call)
        let result = this.get(END_OF_BATCH)
        if (result.ok) {
            this.unwrapBatchItems(items)
        } else {
            this.visitFailedCall(items[result.failedItem], result.error)
            this.unwrapBatchItems(items.slice(0, result.failedItem))
        }
    }

    private unwrapBatchAll(call: Call): void {
        this.get(e => e.name == 'Utility.BatchCompleted')
        let items = this.getSubcalls(call)
        this.unwrapBatchItems(items)
    }

    private unwrapBatchItems(items: Call[]): void {
        if (items.length == 0) return
        if (!this.bp.runtime.hasEvent('Utility.ItemCompleted')) {
            // Utility.ItemCompleted doesn't exist yet
            // Don't expand this call
            return
        }
        for (let i = items.length - 1; i >= 0; i--) {
            this.get(ITEM_COMPLETED)
            let boundary = this.boundary
            if (i > 0) {
                this.boundary = ITEM_COMPLETED
            }
            this.visitCall(items[i])
            this.boundary = boundary
        }
    }

    private unwrapForceBatch(call: Call): void {
        this.get(END_OF_FORCE_BATCH)
        let items = this.getSubcalls(call)
        for (let i = items.length - 1; i >= 0; i--) {
            let result = this.get(FORCE_BATCH_ITEM)
            if (result.ok) {
                let boundary = this.boundary
                if (i > 0) {
                    this.boundary = FORCE_BATCH_ITEM
                }
                this.visitCall(items[i])
                this.boundary = boundary
            } else {
                this.visitFailedCall(call, result.error)
            }
        }
    }

    private unwrapDispatchAs(call: Call): void {
        let sub = this.getSubcall(call, assertNotNull(call.args.asOrigin))
        this.visitUnwrapped(sub, event => {
            if (event.name != 'Utility.DispatchedAs') return
            let result = 'result' in event.args ? event.args.result : event.args
            switch(result.__kind) {
                case 'Ok':
                    return {ok: true}
                case 'Err':
                    return {ok: false, error: result.value}
                default:
                    throw unexpectedCase(result.__kind)
            }
        })
    }

    private unwrapProxy(call: Call): void {
        let real = call.args.real
        assert(real instanceof Uint8Array)
        let sub = this.getSubcall(call, signedOrigin(real))
        this.visitUnwrapped(sub, event => {
            if (event.name != 'Proxy.ProxyExecuted') return
            let result = 'result' in event.args ? event.args.result : event.args
            switch(result.__kind) {
                case 'Ok':
                    return {ok: true}
                case 'Err':
                    return {ok: false, error: result.value}
                default:
                    throw unexpectedCase(result.__kind)
            }
        })
    }

    private unwrapSudo(call: Call): void {
        let args = call.args as {
            call: decoded.Call
            proposal?: undefined
        } | {
            call?: undefined
            proposal: decoded.Call
        }
        let sub = this.bp.createCall(
            call.extrinsicIndex,
            call.address.concat([0]),
            args.call || args.proposal,
            rootOrigin()
        )
        this.visitUnwrapped(sub, END_OF_SUDO)
    }

    private unwrapSudoAs(call: Call): void {
        let args = call.args as {
            call: decoded.Call
            proposal?: undefined
            who: any
        } | {
            call?: undefined
            proposal: decoded.Call
            who: any
        }
        let origin: decoded.SignedOrigin | undefined
        if (args.who?.__kind === 'AccountId' && args.who?.value instanceof Uint8Array) {
            origin = signedOrigin(args.who.value)
        }
        let sub = this.bp.createCall(
            call.extrinsicIndex,
            call.address.concat([0]),
            args.call || args.proposal,
            origin
        )
        this.visitUnwrapped(sub, END_OF_SUDO)
    }

    private visitUnwrapped(call: Call, boundary: Boundary<CallResult>): void {
        let result = this.get(boundary)
        if (result.ok) {
            this.visitCall(call)
        } else {
            this.visitFailedCall(call, result.error)
        }
    }

    private visitFailedCall(call: Call, error?: any): void {
        call.success = false
        call.error = error
        this.calls.push(call)
    }

    private getSubcalls(call: Call, origin?: any | null): Call[] {
        if (origin === undefined) {
            origin = call.origin
        }
        let subcalls = call.args.calls as decoded.Call[]
        return subcalls.map((sub, idx) => {
            return this.bp.createCall(
                call.extrinsicIndex,
                call.address.concat([idx]),
                sub,
                origin ?? undefined
            )
        })
    }

    private getSubcall(call: Call, origin?: any | null): Call {
        if (origin === undefined) {
            origin = call.origin
        }
        return this.bp.createCall(
            call.extrinsicIndex,
            call.address.concat([0]),
            call.args.call,
            origin ?? undefined
        )
    }

    private get<T>(boundary: Boundary<T>): T {
        while (true) {
            let event = this.next()
            event.callAddress = this.address
            let match = boundary(event)
            if (match) return match
        }
    }

    private lookup(boundary: Boundary<any>): boolean {
        let pos = this.eventPos
        try {
            let event: Event | undefined
            while (event = this.maybeNext()) {
                if (this.boundary?.(event)) {
                    return false
                }
                if (boundary(event)) {
                    return true
                }
            }
            return false
        } finally {
            this.eventPos = pos
        }
    }

    private takeEvents(): void {
        let event: Event | undefined
        while (event = this.maybeNext()) {
            if (this.boundary?.(event)) {
                this.eventPos += 1
                return
            } else {
                event.callAddress = this.address
            }
        }
    }

    private next(): Event {
        return assertNotNull(
            this.maybeNext(),
            'missing required event'
        )
    }

    private maybeNext(): Event | undefined {
        while (this.eventPos >= 0) {
            let event = this.events[this.eventPos]
            if (event.phase === 'ApplyExtrinsic') {
                if (event.callAddress![0] !== this.extrinsic.index) return
                this.eventPos -= 1
                return event
            } else {
                this.eventPos -= 1
            }
        }
    }
}


type EndOfBatch = {
    ok: true
} | {
    ok: false
    failedItem: number
    error: any
}


function END_OF_BATCH(event: Event):  EndOfBatch | undefined {
    switch(event.name) {
        case 'Utility.BatchCompleted':
            return {ok: true}
        case 'Utility.BatchInterrupted':
            let failedItem
            let error
            if (Array.isArray(event.args)) {
                failedItem = event.args[0]
                error = event.args[1]
            } else {
                failedItem = event.args.index
                error = event.args.error
            }
            return {
                ok: false,
                failedItem,
                error
            }
        default:
            return undefined
    }
}


function ITEM_COMPLETED(event: Event): boolean {
   return event.name == 'Utility.ItemCompleted'
}


function END_OF_FORCE_BATCH(event: Event): boolean {
    switch(event.name) {
        case 'Utility.BatchCompleted':
        case 'Utility.BatchCompletedWithErrors':
            return true
        default:
            return false
    }
}

interface CallResult {
    ok: boolean
    error?: any
}


function FORCE_BATCH_ITEM(event: Event): CallResult | undefined {
    switch(event.name) {
        case 'Utility.ItemCompleted':
            return {ok: true}
        case 'Utility.ItemFailed':
            return {
                ok: false,
                error: event.args.error
            }
    }
}


function END_OF_SUDO(event: Event): CallResult | undefined {
    switch(event.name) {
        case "Sudo.Sudid":
        case "Sudo.SudoAsDone":
            break
        default:
            return
    }
    if (typeof event.args == 'boolean') return {
        ok: event.args,
        error: undefined
    }
    let result = 'sudoResult' in event.args ? event.args.sudoResult : event.args
    switch(result.__kind) {
        case 'Ok':
            return {ok: true}
        case 'Err':
            return {ok: false, error: result.value}
        default:
            throw unexpectedCase(result.__kind)
    }
}


interface MultisigExecuted extends CallResult {
    multisig: unknown
    callHash: Uint8Array
}


function MULTISIG_EXECUTED(event: Event): MultisigExecuted | undefined {
    if (event.name != 'Multisig.MultisigExecuted') return
    let multisig: unknown
    let callHash: Uint8Array
    let result: Result
    if (Array.isArray(event.args)) {
        multisig = event.args[2]
        callHash = event.args[3]
        result = event.args[4]
    } else {
        multisig = event.args.multisig
        callHash = event.args.callHash
        result = event.args.result
    }
    switch(result.__kind) {
        case 'Ok':
            return {
                ok: true,
                multisig,
                callHash
            }
        case 'Err':
            return {
                ok: false,
                error: result.value,
                multisig,
                callHash
            }
        default:
            throw unexpectedCase()
    }
}
