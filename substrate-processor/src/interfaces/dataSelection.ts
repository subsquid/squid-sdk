import type {
    ContractsContractEmittedEvent,
    EvmLogEvent,
    GearMessageEnqueuedEvent,
    GearUserMessageSentEvent,
    SubstrateCall,
    SubstrateEvent,
    SubstrateExtrinsic
} from './substrate'


type Req<T> = {
    [P in keyof T]?: unknown
}


type PlainReq<T> = {
    [P in keyof T]?: boolean
}


type Select<T, R extends Req<T>> = {
    [P in keyof T as R[P] extends true ? P : P extends 'id' | 'pos' | 'name' | 'success' ? P : never]: T[P]
}


export type WithProp<K extends string, V> = [V] extends [never] ? {} : {
    [k in K]: V
}


type CallScalars<T=SubstrateCall> = Omit<T, 'parent'>
type ExtrinsicScalars = Omit<SubstrateExtrinsic, 'call'>
type EventScalars<T=SubstrateEvent> = Omit<T, 'call' | 'extrinsic'>


export type CallRequest = Omit<PlainReq<CallScalars>, 'id' | 'pos' | 'name' | 'success'> & {
    parent?: PlainReq<SubstrateCall> | boolean
}


export type ExtrinsicRequest = Omit<PlainReq<ExtrinsicScalars>, 'id' | 'pos'> & {
    call?: CallRequest | boolean
}


export type EventRequest = Omit<PlainReq<EventScalars>, 'id' | 'pos' | 'name'> & {
    call?: CallRequest | boolean
    extrinsic?: ExtrinsicRequest | boolean
    evmTxHash?: boolean
}


type CallFields<R extends CallRequest> = Select<CallScalars, R> & (
    R['parent'] extends true
        ? {parent?: CallFields<R>}
        : R['parent'] extends PlainReq<SubstrateCall>
            ? {parent?: CallFields<R['parent']>}
            : {}
    )


export type CallType<R> = R extends true
    ? SubstrateCall
    : R extends CallRequest ? CallFields<R> : never


type ExtrinsicFields<R extends ExtrinsicRequest> = Select<ExtrinsicScalars, R> & (
    R['call'] extends true
        ? {call: SubstrateCall}
        : R['call'] extends CallRequest
            ? {call: CallFields<R['call']>}
            : {}
    )


export type ExtrinsicType<R> = R extends true
    ? SubstrateExtrinsic
    : R extends ExtrinsicRequest ? ExtrinsicFields<R> : never


type AddUndefined<T, R> = [undefined] extends [T] ? undefined : [T] extends [undefined] ? R | undefined : R
type AddOption<T> = {
    [P in keyof T as undefined extends T[P] ? P : never]+?: T[P]
} & {
    [P in keyof T as undefined extends T[P] ? never : P]: T[P]
}


type EventFields<R extends EventRequest, E extends SubstrateEvent = SubstrateEvent> =
    E extends any ?
        Select<EventScalars<E>, R> &
        AddOption<WithProp<'call', AddUndefined<E['call'], CallType<R>>>> &
        AddOption<WithProp<'extrinsic', AddUndefined<E['extrinsic'], ExtrinsicType<R['extrinsic']>>>>
    : never


type GenericEventType<R, E extends SubstrateEvent = SubstrateEvent> = R extends true
    ? E
    : R extends EventRequest ? EventFields<R, E> : never


export type EventType<R, N = string> =
    N extends 'Contracts.ContractEmitted'
        ? GenericEventType<R, ContractsContractEmittedEvent>
        : N extends 'EVM.Log'
            ? GenericEventType<R, EvmLogEvent>
            : N extends 'Gear.MessageEnqueued'
                ? GenericEventType<R, GearMessageEnqueuedEvent>
                : N extends 'Gear.UserMessageSent'
                    ? GenericEventType<R, GearUserMessageSentEvent>
                    : GenericEventType<R>


export interface EventDataRequest {
    event?: boolean | EventRequest
}


export type EventData<R extends EventDataRequest = {event: true}, N = string>
    = WithProp<'event', EventType<R['event'], N>>


export interface CallDataRequest {
    call?: boolean | CallRequest
    extrinsic?: boolean | ExtrinsicRequest
}


export type CallData<R extends CallDataRequest = {call: true, extrinsic: true}> =
    WithProp<"call", CallType<R["call"]>> &
    WithProp<"extrinsic", ExtrinsicType<R["extrinsic"]>>


type SetName<T, N> = T extends any ? Omit<T, "name"> & {name: N} : never
type SetItemName<T, P, N> = P extends keyof T
    ? Omit<T, P> & {[p in P]: SetName<T[P], N>} & {name: N}
    : never


type WithKind<K, T> = {kind: K} & {
    [P in keyof T]: T[P]
}


export type EventItem<N, R = false> = WithKind<
    "event",
    SetItemName<
        R extends true ? EventData<{event: true}, N> : R extends EventDataRequest ? EventData<R, N> : EventData<{event: {}}, N>,
        'event',
        N
        >
    >


export type CallItem<Name, R = false> = WithKind<
    "call",
    SetItemName<
        R extends true ? CallData : R extends CallDataRequest ? CallData<R> : CallData<{call: {}}>,
        "call",
        Name
        >
    >


export type ItemMerge<A, B, R> =
    [A] extends [never]
        ? B
        : [B] extends [never]
            ? A
            : [Exclude<R, undefined | boolean>] extends [never]
                ? A
                : undefined extends A
                    ? undefined | ObjectItemMerge<Exclude<A, undefined>, Exclude<B, undefined>, Exclude<R, undefined | boolean>>
                    : ObjectItemMerge<A, B, Exclude<R, undefined | boolean>>


type ObjectItemMerge<A, B, R> =  {
    [K in keyof A | keyof B]:
    K extends keyof A
        ? K extends keyof B
            ? K extends keyof R
                ? ItemMerge<A[K], B[K], R[K]>
                : A[K]
            : A[K]
        : K extends keyof B ? B[K] : never
}


type ItemKind = {
    kind: string
    name: string
}


type AddItem<T extends ItemKind, I extends ItemKind, R> =
    (T extends Pick<I, "kind" | "name"> ? ItemMerge<T, I, R> : T) |
    Exclude<I, Pick<T, "kind" | "name">>


export type AddEventItem<T extends ItemKind, I extends ItemKind> = AddItem<T, I, EventDataRequest>
export type AddCallItem<T extends ItemKind, I extends ItemKind> = AddItem<T, I, CallDataRequest>


export interface DataSelection<R> {
    data: R
}


export interface NoDataSelection {
    data?: undefined
}


export interface MayBeDataSelection<R> {
    data?: R
}
