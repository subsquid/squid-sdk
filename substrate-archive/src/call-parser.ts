import {QualifiedName} from "@subsquid/substrate-metadata"
import {assertNotNull, unexpectedCase} from "@subsquid/util-internal"
import {SpecInfo, sub} from "./interfaces"
import * as model from "./model"
import {Warning} from "./model"
import {formatId, unwrapArguments} from "./util/misc"


interface Call extends model.Call {
    children: Call[]
}


export class CallParser {
    private numberOfCalls = 0
    private calls: Call[] = []
    private pos: number
    private boundary?: (e: model.Event) => unknown
    private _extrinsic: model.Extrinsic | undefined

    constructor(
        private specInfo: SpecInfo,
        private blockHeight: number,
        private blockHash: string,
        private events: model.Event[],
        private extrinsics: (model.Extrinsic & {args: any})[],
        private warnings: Warning[]
    ) {
        for (let i = 0; i < this.extrinsics.length; i++) {
            let ex = this.extrinsics[i]
            this.extrinsic = ex
            this.extrinsic.call_id = formatId(this.blockHeight, this.blockHash, this.numberOfCalls)
            this.createCall(ex.name, ex.args)
        }
        this.pos = this.events.length - 1
        for (let i = this.extrinsics.length - 1; i >= 0; i--) {
            this.extrinsic = this.extrinsics[i]
            this.visitExtrinsic(this.calls[i])
        }
    }

    getCalls(): model.Call[] {
        let calls: model.Call[] = []

        function push(c: Call): void {
            let {children, ...call} = c
            calls.push(call)
            children.forEach(push)
        }

        this.calls.forEach(push)
        return calls
    }

    private createCall(name: QualifiedName, args: unknown, parent?: Call): void {
        let index = this.numberOfCalls++
        let call: Call = {
            id: formatId(this.blockHeight, this.blockHash, index),
            extrinsic_id: this.extrinsic.id,
            name,
            index,
            args,
            parent_id: parent?.id,
            success: false,
            children: []
        }
        switch(name) {
            case 'utility.batch':
            case 'utility.batch_all': {
                let batch = args as {calls: sub.Call[]}
                for (let item of batch.calls) {
                    this.unwrapAndCreate(item, call)
                }
                break
            }
            case 'utility.as_derivative':
            case 'utility.as_sub':
            case 'utility.as_limited_sub':
            case 'utility.dispatch_as':
            case 'proxy.proxy': {
                let a = args as {call: sub.Call}
                this.unwrapAndCreate(a.call, call)
            }
        }
        if (parent) {
            parent.children.push(call)
        } else {
            this.calls.push(call)
        }
    }

    private unwrapAndCreate(call: sub.Call, parent?: Call): void  {
        let c = unwrapArguments(call, this.specInfo.calls)
        this.createCall(c.name, c.args, parent)
    }

    private visitExtrinsic(call: Call): void {
        let event = this.next()
        switch(event.name) {
            case 'system.ExtrinsicSuccess':
                this.extrinsic.success = true
                this.visitCall(call)
                break
            case 'system.ExtrinsicFailed':
                this.extrinsic.success = false
                while (this.tryNext()) {}
                break
            default:
                throw unexpectedCase(event.name)
        }
    }

    private visitCall(call: Call, parent?: Call): void {
        call.success = true
        switch(call.name) {
            case 'utility.batch':
                this.visitBatch(call, parent)
                break
            case 'utility.batch_all':
                this.visitBatchAll(call, parent)
                break
            case 'utility.dispatch_as':
                this.visitDispatchAs(call, parent)
                break
            case 'utility.as_derivative':
            case 'utility.as_sub':
            case 'utility.as_limited_sub':
                this.visitCall(call.children[0], call)
                break
            case 'proxy.proxy':
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
            this.takeEvents(batch)
            return
        }
        let idx = lastCompletedItem
        if (this.lookup(BATCH_ITEM_COMPLETED) == null) {
            // ItemCompleted were not yet implemented
            // assign all events to batch call and set all
            // calls as successful.
            let event
            while (event = this.tryNext()) {
                event.call_id = batch.id
                if (isFailure(event)) {
                    let message = `WARNING: batch call ${batch.id} has failed nested calls (linked to event ${event.id}) which will be marked as successful.`
                    console.error(message)
                    this.warnings.push({block_id: this.extrinsic.block_id, message})
                }
            }
            this.takeEvents(batch)
            while (idx >= 0) {
                this.markAsSuccessful(batch.children[idx])
                idx -= 1
            }
        } else {
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

    private markAsSuccessful(call: Call): void {
        call.success = true
        call.children.forEach(c => this.markAsSuccessful(c))
    }

    private visitDispatchAs(call: Call, parent?: Call): void {
        let result = this.find(parent, DISPATCHED_AS)
        result.event.call_id = call.id
        if (result.ok) {
            this.visitCall(call.children[0], call)
        } else {
            this.takeEvents(call)
        }
    }

    private visitProxyCall(call: Call, parent?: Call): void {
        let result = this.find(parent, PROXY_EXECUTED)
        result.event.call_id = call.id
        if (result.ok) {
            this.visitCall(call.children[0], call)
        } else {
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
        let pos = this.pos
        let event, m
        while (event = this.tryNext()) {
            m = test(event)
            if (m != null) break
        }
        this.pos = pos
        return m
    }

    private next(): model.Event {
        return assertNotNull(this.tryNext())
    }

    private tryNext(): model.Event | undefined {
        while (this.pos >= 0) {
            let event = this.events[this.pos]
            if (event.phase == 'ApplyExtrinsic') {
                if (this.boundary?.(event)) {
                    return undefined
                }
                if (event.extrinsic_id == this.extrinsic.id) {
                    this.pos -= 1
                    return event
                } else {
                    return undefined
                }
            } else {
                this.pos -= 1
            }
        }
    }

    private get extrinsic(): model.Extrinsic {
        return assertNotNull(this._extrinsic)
    }

    private set extrinsic(ex: model.Extrinsic) {
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
        case 'utility.BatchCompleted':
            return {ok: true, event}
        case 'utility.BatchInterrupted':
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
    if (event.name == 'utility.ItemCompleted') return event
}


function BATCH_COMPLETED(event: model.Event): model.Event | undefined {
    if (event.name == 'utility.BatchCompleted') return event
}


function DISPATCHED_AS(event: model.Event): {ok: boolean, event: model.Event} | undefined {
    if (event.name != 'utility.DispatchedAs') return undefined
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
    if (event.name != 'proxy.ProxyExecuted') return undefined
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
        case 'proxy.ProxyExecuted':
            return !PROXY_EXECUTED(event)!.ok
        case 'utility.DispatchedAs':
            return !DISPATCHED_AS(event)!.ok
        case 'utility.BatchInterrupted':
            return !END_OF_BATCH(event)!.ok
        default:
            return false
    }
}
