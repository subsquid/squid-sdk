import {assertNotNull, unexpectedCase} from "@subsquid/util-internal"
import assert from "assert"
import {Spec, sub} from "../interfaces"
import * as model from "../model"
import type {ExtrinsicExt} from "./block"
import {unwrapArguments} from "./util"


interface BlockCtx {
    blockHeight: number
    blockHash: string
    spec: Spec
}


interface Call extends model.Call {
    children: Call[]
}


class CallExtractor {
    calls: Call[] = []
    count = 0
    private idx = 0
    private _extrinsic?: ExtrinsicExt

    constructor(private ctx: BlockCtx) {}

    visit(extrinsic: ExtrinsicExt): void {
        this._extrinsic = extrinsic
        this.createCall(extrinsic.call)
    }

    private createCall(raw: sub.Call, parent?: Call): void {
        let id = this.extrinsic.id
        if (parent) {
            let idx = this.idx += 1
            id += '-' + idx.toString().padStart(6, '0')
        } else {
            this.idx = 0
        }

        let {name, args} = unwrapArguments(raw, this.ctx.spec.calls)

        let call: Call = {
            id,
            block_id: this.extrinsic.block_id,
            extrinsic_id: this.extrinsic.id,
            success: false,
            name,
            args,
            parent_id: parent?.id,
            pos: -1,
            children: []
        }

        switch(name) {
            case 'Utility.batch':
            case 'Utility.batch_all': {
                let batch = args as {calls: sub.Call[]}
                for (let item of batch.calls) {
                    this.createCall(item, call)
                }
                break
            }
            case 'Utility.as_derivative':
            case 'Utility.as_sub':
            case 'Utility.as_limited_sub':
            case 'Utility.dispatch_as':
            case 'Proxy.proxy': {
                let a = args as {call: sub.Call}
                this.createCall(a.call, call)
                break
            }
        }

        if (parent) {
            parent.children.push(call)
        } else {
            this.calls.push(call)
        }

        this.count += 1
    }

    private get extrinsic(): ExtrinsicExt {
        return assertNotNull(this._extrinsic)
    }

    private set extrinsic(ex: ExtrinsicExt) {
        this._extrinsic = ex
    }
}


function extractCalls(ctx: BlockCtx, extrinsics: ExtrinsicExt[]): {calls: Call[], count: number} {
    let extractor = new CallExtractor(ctx)
    for (let ex of extrinsics) {
        extractor.visit(ex)
    }
    return extractor
}


export class CallParser {
    public readonly warnings: model.Warning[] = []
    public readonly calls: Call[] = []
    private pos: number
    private eix: number
    private boundary?: (e: model.Event) => unknown
    private _extrinsic: ExtrinsicExt | undefined

    constructor(
        private ctx: BlockCtx,
        private events: model.Event[],
        private extrinsics: ExtrinsicExt[],
    ) {
        let {calls, count} = extractCalls(ctx, extrinsics)
        this.pos = count + this.events.length + this.extrinsics.length
        this.eix = this.events.length - 1
        for (let i = this.extrinsics.length - 1; i >= 0; i--) {
            this.extrinsic = this.extrinsics[i]
            this.visitExtrinsic(calls[i])
        }
        assert(this.pos == 0)
    }

    private visitExtrinsic(call: Call): void {
        this.extrinsic.pos = this.takePos()
        let event = this.next()
        switch(event.name) {
            case 'System.ExtrinsicSuccess':
                this.extrinsic.success = true
                this.visitCall(call)
                break
            case 'System.ExtrinsicFailed':
                this.extrinsic.success = false
                this.skipCall(call, false)
                while (this.tryNext()) {}
                break
            default:
                throw unexpectedCase(event.name)
        }
    }

    private skipCall(call: Call, success: boolean): void {
        call.pos = this.takePos()
        call.success = success
        this.calls.push(call)
        this.skipCalls(call.children, success)
    }

    private skipCalls(calls: Call[], success: boolean): void {
        for (let i = calls.length - 1; i >= 0; i--) {
            this.skipCall(calls[i], success)
        }
    }

    private visitCall(call: Call, parent?: Call): void {
        call.pos = this.takePos()
        call.success = true
        this.calls.push(call)
        switch(call.name) {
            case 'Utility.batch':
                this.visitBatch(call, parent)
                break
            case 'Utility.batch_all':
                this.visitBatchAll(call, parent)
                break
            case 'Utility.dispatch_as':
                this.visitDispatchAs(call, parent)
                break
            case 'Utility.as_derivative':
            case 'Utility.as_sub':
            case 'Utility.as_limited_sub':
                this.visitCall(call.children[0], call)
                break
            case 'Proxy.proxy':
                this.visitProxyCall(call, parent)
                break
            default:
                this.takeEvents(call)
        }
    }

    private visitBatch(call: Call, parent?: Call): void {
        let end = this.find(parent, END_OF_BATCH)
        end.event.call_id = call.id
        this.visitBatchItems(call, end.ok ? call.children.length - 1 : end.failedItem - 1)
    }

    private visitBatchAll(call: Call, parent?: Call): void {
        let end = this.find(parent, BATCH_COMPLETED)
        end.call_id = call.id
        this.visitBatchItems(call, call.children.length - 1)
    }

    private visitBatchItems(batch: Call, lastCompletedItem: number) {
        if (lastCompletedItem < 0) {
            this.skipCalls(batch.children, false)
            this.takeEvents(batch)
            return
        }
        this.skipCalls(batch.children.slice(lastCompletedItem + 1), false)
        if (this.lookup(BATCH_ITEM_COMPLETED) == null) {
            // ItemCompleted were not yet implemented
            // assign all events to batch call and set all
            // calls as successful.
            this.skipCalls(batch.children.slice(0, lastCompletedItem + 1), true)
            let event
            while (event = this.tryNext()) {
                event.call_id = batch.id
                if (isFailure(event)) {
                    let message = `WARNING: batch call ${batch.id} has failed nested calls (linked to event ${event.id}) which will be marked as successful.`
                    console.error(message)
                    this.warnings.push({block_id: this.extrinsic.block_id, message})
                }
            }
        } else {
            let idx = lastCompletedItem
            while (idx >= 0) {
                let boundary = this.boundary
                let endOfItem = this.find(batch, BATCH_ITEM_COMPLETED)
                endOfItem.call_id = batch.id
                if (idx > 0) {
                    this.boundary = BATCH_ITEM_COMPLETED
                }
                this.visitCall(batch.children[idx], batch)
                this.boundary = boundary
                idx -= 1
            }
        }
    }

    private visitDispatchAs(call: Call, parent?: Call): void {
        let result = this.find(parent, DISPATCHED_AS)
        result.event.call_id = call.id
        if (result.ok) {
            this.visitCall(call.children[0], call)
        } else {
            this.skipCall(call.children[0], false)
            this.takeEvents(call)
        }
    }

    private visitProxyCall(call: Call, parent?: Call): void {
        let result = this.find(parent, PROXY_EXECUTED)
        result.event.call_id = call.id
        if (result.ok) {
            this.visitCall(call.children[0], call)
        } else {
            this.skipCall(call.children[0], false)
            this.takeEvents(call)
        }
    }

    private takeEvents(call: Call): void {
        let event: model.Event | undefined
        while (event = this.tryNext()) {
            event.call_id = call.id
        }
    }

    private find<T>(parent: Call | undefined, test: (e: model.Event) => T | undefined): T {
        while (true) {
            let event = this.next()
            let m = test(event)
            if (m == null) {
                event.call_id = parent?.id
            } else {
                return m
            }
        }
    }

    private lookup<T>(test: (e: model.Event) => T | undefined): T | undefined {
        let eix = this.eix
        let pos = this.pos
        let event, m
        while (event = this.tryNext()) {
            m = test(event)
            if (m != null) break
        }
        this.pos = pos
        this.eix = eix
        return m
    }

    private next(): model.Event {
        return assertNotNull(this.tryNext())
    }

    private tryNext(): model.Event | undefined {
        while (this.eix >= 0) {
            let event = this.events[this.eix]
            if (event.phase == 'ApplyExtrinsic') {
                if (this.boundary?.(event)) {
                    return undefined
                }
                if (event.extrinsic_id == this.extrinsic.id) {
                    event.pos = this.takePos()
                    this.eix -= 1
                    return event
                } else {
                    return undefined
                }
            } else {
                event.pos = this.takePos()
                this.eix -= 1
            }
        }
    }

    private takePos(): number {
        return this.pos -= 1
    }

    private get extrinsic(): ExtrinsicExt {
        return assertNotNull(this._extrinsic)
    }

    private set extrinsic(ex: ExtrinsicExt) {
        this._extrinsic = ex
    }
}


type EndOfBatch = {
    ok: true
    event: model.Event
} | {
    ok: false,
    failedItem: number
    event: model.Event
}


function END_OF_BATCH(event: model.Event): EndOfBatch | undefined {
    switch(event.name) {
        case 'Utility.BatchCompleted':
            return {ok: true, event}
        case 'Utility.BatchInterrupted':
            let failedItem = Array.isArray(event.args) ? event.args[0] : event.args.index
            return {
                ok: false,
                failedItem,
                event
            }
        default:
            return undefined
    }
}


function BATCH_ITEM_COMPLETED(event: model.Event): model.Event | undefined {
    if (event.name == 'Utility.ItemCompleted') return event
}


function BATCH_COMPLETED(event: model.Event): model.Event | undefined {
    if (event.name == 'Utility.BatchCompleted') return event
}


function DISPATCHED_AS(event: model.Event): {ok: boolean, event: model.Event} | undefined {
    if (event.name != 'Utility.DispatchedAs') return undefined
    let result = 'result' in event.args ? event.args.result : event.args
    switch(result.__kind) {
        case 'Ok':
            return {ok: true, event}
        case 'Err':
            return {ok: false, event}
        default:
            throw unexpectedCase(result.__kind)
    }
}


function PROXY_EXECUTED(event: model.Event): {ok: boolean, event: model.Event} | undefined {
    if (event.name != 'Proxy.ProxyExecuted') return undefined
    let result = 'result' in event.args ? event.args.result : event.args
    switch(result.__kind) {
        case 'Ok':
            return {ok: true, event}
        case 'Err':
            return {ok: false, event}
        default:
            throw unexpectedCase(result.__kind)
    }
}


function isFailure(event: model.Event): boolean {
    switch(event.name) {
        case 'Proxy.ProxyExecuted':
            return !PROXY_EXECUTED(event)!.ok
        case 'Utility.DispatchedAs':
            return !DISPATCHED_AS(event)!.ok
        case 'Utility.BatchInterrupted':
            return !END_OF_BATCH(event)!.ok
        default:
            return false
    }
}
