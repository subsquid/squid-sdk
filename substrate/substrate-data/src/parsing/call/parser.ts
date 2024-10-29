import {DecodedCall, EventRecord, Runtime} from '@subsquid/substrate-runtime'
import {array, bytes, externalEnum, struct, tuple, Type, union, unknown} from '@subsquid/substrate-runtime/lib/sts'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {Call, Event, Extrinsic} from '../../interfaces/data'
import {RawBlock} from '../../interfaces/data-raw'
import {Address, IAddress, IOrigin} from '../../types/system'
import {assertCall, assertEvent} from '../../types/util'
import {DecodedExtrinsic} from '../extrinsic'
import {addressOrigin} from '../util'
import {visitBatch, visitBatchAll, visitForceBatch} from './batch'
import {unwrapDispatchAs, visitDispatchAs} from './dispatch_as'
import {visitApproveAsMulti, visitAsMulti} from './multisig'
import {unwrapProxy, visitProxy} from './proxy'
import {unwrapSudo, unwrapSudoAs, visitSudo, visitSudoAs} from './sudo'


export type Boundary<T> = (runtime: Runtime, event: Event) => T | undefined | null | false


export interface CallResult {
    ok: boolean
    error?: unknown
}


type IExtrinsicFailed = {
    dispatchError: unknown
} | [
    dispatchInfo: unknown,
    dispatchError: unknown
]


const ExtrinsicFailed: Type<IExtrinsicFailed> = union(
    struct({dispatchError: unknown()}),
    tuple([unknown(), unknown()])
)


const CallWrapper = struct({
    call: union(externalEnum(), bytes())
})


const CallListWrapper = struct({
    calls: array(externalEnum())
})


export class CallParser {
    private calls: Call[] = []
    private eventPos: number
    private extrinsic!: Extrinsic
    private address?: number[]
    private boundary?: Boundary<unknown>

    constructor(
        public readonly runtime: Runtime,
        public readonly block: RawBlock,
        private extrinsics: DecodedExtrinsic[],
        private events: Event[]
    ) {
        this.eventPos = events.length - 1
    }

    parse(): Call[] {
        for (let i = this.extrinsics.length - 1; i >= 0; i--) {
            this.extrinsic = this.extrinsics[i].extrinsic

            let origin: IOrigin | undefined
            if (this.extrinsic.signature && this.runtime.checkType(this.runtime.description.address, Address)) {
                origin = addressOrigin(this.extrinsic.signature.address as IAddress)
            }

            let call: Call = {
                extrinsicIndex: i,
                address: [],
                ...this.extrinsics[i].call,
                origin
            }

            let event = this.next()
            switch(event.name) {
                case 'System.ExtrinsicSuccess':
                    this.extrinsic.success = true
                    this.visitCall(call)
                    break
                case 'System.ExtrinsicFailed':
                    let err = this.getExtrinsicFailedError(event)
                    this.extrinsic.success = false
                    this.extrinsic.error = err
                    this.visitFailedCall(call, err)
                    this.takeEvents()
                    break
                default:
                    throw unexpectedCase(event.name)
            }
        }

        return this.calls.reverse()
    }

    private getExtrinsicFailedError(event: EventRecord): unknown {
        assert(event.name == 'System.ExtrinsicFailed')
        assertEvent(this.runtime, ExtrinsicFailed, event)
        if (Array.isArray(event.args)) {
            return event.args[1]
        } else {
            return event.args.dispatchError
        }
    }

    createCall(extrinsicIndex: number, address: number[], src: DecodedCall, origin?: IOrigin): Call {
        let {name, args} = this.runtime.toCallRecord(src)
        return {
            extrinsicIndex,
            address,
            name,
            args,
            origin
        }
    }

    visitCall(call: Call): void {
        call.success = true
        this.calls.push(call)

        let parentAddress = this.address
        this.address = call.address

        switch(call.name) {
            case 'Multisig.as_multi':
                visitAsMulti(this, call)
                break
            case 'Multisig.approve_as_multi':
                visitApproveAsMulti(this, call)
                break
            case 'Multisig.as_multi_threshold_1':
                // FIXME: compute origin
                this.visitCall(this.getSubcall(call, null))
                break
            case 'Utility.batch':
                visitBatch(this, call)
                break
            case 'Utility.batch_all':
                visitBatchAll(this, call)
                break
            case 'Utility.force_batch':
                visitForceBatch(this, call)
                break
            case 'Utility.dispatch_as':
                visitDispatchAs(this, call)
                break
            case 'Utility.as_derivative':
            case 'Utility.as_sub':
            case 'Utility.as_limited_sub':
                // FIXME: compute origin
                this.visitCall(this.getSubcall(call, null))
                break
            case 'Proxy.proxy':
            case 'Proxy.proxy_announced':
                visitProxy(this, call)
                break
            case 'Sudo.sudo':
            case 'Sudo.sudo_unchecked_weight':
                visitSudo(this, call)
                break
            case 'Sudo.sudo_as':
                visitSudoAs(this, call)
                break
        }

        this.takeEvents()
        this.address = parentAddress
    }

    visitSubcall(call: Call, boundary: Boundary<CallResult>): void {
        let result = this.get(boundary)
        if (result.ok) {
            this.visitCall(call)
        } else {
            this.visitFailedCall(call, result.error)
        }
    }

    visitFailedCall(call: Call, error?: unknown): void {
        call.success = false
        call.error = error
        this.calls.push(call)
    }

    unwrap(call: Call, success: boolean): void {
        this.calls.push(call)
        call.success = success

        let parentAddress = this.address
        this.address = call.address

        switch(call.name) {
            case 'Utility.batch':
            case 'Utility.batch_all':
            case 'Utility.force_batch':
                for (let sub of this.getSubcalls(call)) {
                    this.unwrap(sub, success)
                }
                break
            case 'Utility.dispatch_as':
                unwrapDispatchAs(this, call, success)
                break
            case 'Utility.as_derivative':
            case 'Utility.as_sub':
            case 'Utility.as_limited_sub':
            case 'Multisig.as_multi':
            case 'Multisig.as_multi_threshold_1': {
                let sub = this.getSubcall(call, null)
                this.unwrap(sub, success)
                break
            }
            case 'Proxy.proxy':
            case 'Proxy.proxy_announced':
                unwrapProxy(this, call, success)
                break
            case 'Sudo.sudo':
            case 'Sudo.sudo_unchecked_weight':
                unwrapSudo(this, call, success)
                break
            case 'Sudo.sudo_as':
                unwrapSudoAs(this, call, success)
                break
        }

        this.address = parentAddress
    }

    getSubcalls(call: Call, origin?: IOrigin | null): Call[] {
        if (origin === undefined) {
            origin = call.origin
        }
        assertCall(this.runtime, CallListWrapper, call)
        let subcalls = call.args.calls
        return subcalls.map((sub, idx) => {
            return this.createCall(
                call.extrinsicIndex,
                call.address.concat([idx]),
                sub,
                origin ?? undefined
            )
        })
    }

    getSubcall(call: Call, origin?: IOrigin | null): Call {
        if (origin === undefined) {
            origin = call.origin
        }
        assertCall(this.runtime, CallWrapper, call)
        let sub = call.args.call
        if (typeof sub == 'string') {
            sub = this.runtime.decodeCall(sub)
        }
        return this.createCall(
            call.extrinsicIndex,
            call.address.concat([0]),
            sub,
            origin ?? undefined
        )
    }

    withBoundary<T>(boundary: Boundary<unknown>, cb: () => T): T {
        let current = this.boundary
        this.boundary = boundary
        try {
            return cb()
        } finally {
            this.boundary = current
        }
    }

    get<T>(boundary: Boundary<T>): T {
        while (true) {
            let event = this.next()
            event.callAddress = this.address
            let match = boundary(this.runtime, event)
            if (match) return match
        }
    }

    isPresent(boundary: Boundary<unknown>): boolean {
        let pos = this.eventPos
        try {
            let event: Event | undefined
            while (event = this.maybeNext()) {
                if (this.boundary?.(this.runtime, event)) {
                    return false
                }
                if (boundary(this.runtime, event)) {
                    return true
                }
            }
            return false
        } finally {
            this.eventPos = pos
        }
    }

    takeEvents(): void {
        let event: Event | undefined
        while (event = this.maybeNext()) {
            if (this.boundary?.(this.runtime, event)) {
                this.eventPos += 1
                return
            } else {
                event.callAddress = this.address
            }
        }
    }

    next(): Event {
        return assertNotNull(
            this.maybeNext(),
            'missing required event'
        )
    }

    maybeNext(): Event | undefined {
        while (this.eventPos >= 0) {
            let event = this.events[this.eventPos]
            if (event.phase === 'ApplyExtrinsic') {
                if (event.extrinsicIndex !== this.extrinsic.index) {
                    if (event.name.includes('Migrations.')) {
                        let index = assertNotNull(event.extrinsicIndex)
                        // Besides `Migrations.*` events there can be more parachain-defined events,
                        // so we skip all events related to the "phantom" extrinsic.
                        this.skipExtrinsicEvents(index)
                        continue
                    } else {
                        return
                    }
                }

                this.eventPos -= 1
                return event
            } else {
                this.eventPos -= 1
            }
        }
    }

    private skipExtrinsicEvents(extrinsicIndex: number) {
        while (true) {
            let event = this.events[this.eventPos]
            if (event.extrinsicIndex == extrinsicIndex) {
                this.eventPos -= 1
            } else {
                break
            }
        }
    }
}
