import assert from "assert"
import {SpecInfo, sub} from "./interfaces"
import {Call, Event, Extrinsic} from "./model"
import {formatId, unwrapCall} from "./util"


type Success = boolean
type Boundary = (eventName: string) => Success | undefined


function asEndOfExtrinsic(eventName: string): boolean | undefined {
    switch(eventName) {
        case 'system.ExtrinsicSuccess':
            return true
        case 'system.ExtrinsicFailed':
            return false
        default:
            return undefined
    }
}


function asEndOfBatchItem(event: string): boolean | undefined {
    switch(event) {
        case 'utility.ItemCompleted':
            return true
        case 'utility.BatchInterrupted':
            return false
        default:
            return undefined
    }
}


function asEndOfBatchAllItem(event: string): boolean | undefined {
    switch(event) {
        case 'utility.ItemCompleted':
            return true
        case 'utility.':
            return false
        default:
            return undefined
    }
}


export class CallParser {
    public readonly calls: Call[] = []
    private callStack: Call[] = []
    private pos = 0

    constructor(
        private specInfo: SpecInfo,
        private blockHeight: number,
        private blockHash: string,
        private events: Event[],
        private extrinsics: (Extrinsic & {args: any})[]
    ) {
        for (let i = 0; i < this.extrinsics.length; i++) {
            let ex = this.extrinsics[i]
            ex.success = this.visitCall(ex, ex.name, ex.args, asEndOfExtrinsic)
        }
    }

    private visitCall(ex: Extrinsic, name: string, args: unknown, boundary: Boundary): Success {
        let index = this.calls.length
        let call: Call = {
            id: formatId(this.blockHeight, this.blockHash, index),
            extrinsic_id: ex.id,
            name,
            index,
            args,
            parent_id: this.parentCall()?.id,
            success: true
        }
        this.calls.push(call)
        this.callStack.push(call)
        switch(name) {
            case 'utility.batch':
                this.visitBatch(ex, args as any)
                break
            case 'utility.batch_all':
                this.visitBatchAll(ex, args as any)
                break
        }
        this.callStack.pop()
        return call.success = this.take(boundary)
    }

    private visitBatch(ex: Extrinsic, args: {calls: sub.Call[]}): void {
        for (let i = 0; i < args.calls.length; i++) {
            let call = unwrapCall(args.calls[i], this.specInfo)
            let ok = this.visitCall(ex, call.name, call.args, asEndOfBatchItem)
            if (!ok) return
        }
    }

    private visitBatchAll(ex: Extrinsic, args: {calls: sub.Call[]}): void {
        for (let i = 0; i < args.calls.length; i++) {
            let call = unwrapCall(args.calls[i], this.specInfo)
            let ok = this.visitCall(ex, call.name, call.args, asEndOfBatchItem)
            if (!ok) return
        }
    }

    private take(boundary: Boundary): Success {
        while (this.pos < this.events.length) {
            let event = this.events[this.pos]
            this.pos += 1
            if (event.phase == 'ApplyExtrinsic') {
                let parent = this.parentCall()
                if (parent) {
                    assert(parent.extrinsic_id === event.extrinsic_id)
                    event.call_id = parent.parent_id
                }
            }
            let success = boundary(event.name)
            if (success != null) return success
        }
        assert(false)
    }

    private parentCall(): Call | undefined {
        return this.callStack.length
            ? this.callStack[this.callStack.length - 1]
            : undefined
    }
}
