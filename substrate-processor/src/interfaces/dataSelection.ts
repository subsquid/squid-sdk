import type {
    ContractsContractEmittedEvent,
    EvmLogEvent,
    SubstrateCall,
    SubstrateEvent,
    SubstrateExtrinsic,
    SubstrateFinalizationEvent,
    SubstrateInitializationEvent
} from "./substrate"


type Req<T> = {
    [P in keyof T]?: unknown
}


type PlainReq<T> = {
    [P in keyof T]?: boolean
}


type Select<T, R extends Req<T>> = {
    [P in keyof T as R[P] extends true ? P : P extends 'id' | 'pos' ? P : never]: T[P]
}


type CallScalars = Omit<SubstrateCall, 'parent'>
type ExtrinsicScalars = Omit<SubstrateExtrinsic, 'call'>
type EventScalars<T=SubstrateEvent> = Omit<T, 'call' | 'extrinsic'>


type CallRequest = PlainReq<CallScalars> & {
    parent?: PlainReq<SubstrateCall> | boolean
}


type ExtrinsicRequest = PlainReq<ExtrinsicScalars> & {
    call?: CallRequest | boolean
}


type EventRequest = PlainReq<EventScalars> & {
    call?: CallRequest | boolean
    extrinsic?: ExtrinsicRequest | boolean
    evmTxHash?: boolean
}


type _CallFields<R extends CallRequest> = Select<CallScalars, R> & (
    R['parent'] extends true
        ? {parent?: _CallFields<R>}
        : R['parent'] extends PlainReq<SubstrateCall>
            ? {parent?: _CallFields<R['parent']>}
            : {}
)


export interface CallContextRequest {
    call?: CallRequest | boolean
    extrinsic?: ExtrinsicRequest | boolean
}


export type CallFields<R extends CallContextRequest> = R['call'] extends true
    ? SubstrateCall
    : R['call'] extends CallRequest
        ? _CallFields<R['call']>
        : undefined


type _ExtrinsicFields<R extends ExtrinsicRequest> = Select<ExtrinsicScalars, R> & (
    R['call'] extends true
        ? {call: SubstrateCall}
        : R['call'] extends CallRequest
            ? {call: _CallFields<R['call']>}
            : {}
)


export interface ExtrinsicContextRequest {
    extrinsic?: ExtrinsicRequest | boolean
}


export type ExtrinsicFields<R extends ExtrinsicContextRequest> = R['extrinsic'] extends true
    ? SubstrateExtrinsic
    : R['extrinsic'] extends ExtrinsicRequest
        ? _ExtrinsicFields<R['extrinsic']>
        : undefined


type _ApplyExtrinsicFields<R extends EventRequest> = (
    R['call'] extends true
        ? {call: SubstrateCall, phase: 'ApplyExtrinsic'}
        : R['call'] extends CallRequest
            ? {call: _CallFields<R['call']>, phase: 'ApplyExtrinsic'}
            : {}
) & (
    R['extrinsic'] extends true
        ? {extrinsic: SubstrateExtrinsic, phase: 'ApplyExtrinsic'}
        : R['extrinsic'] extends ExtrinsicRequest
            ? {extrinsic: _ExtrinsicFields<R['extrinsic']>, phase: 'ApplyExtrinsic'}
            : {}
)


type _EventFields<R extends EventRequest> =
    (
        Select<SubstrateInitializationEvent | SubstrateFinalizationEvent, R> &
        {extrinsic?: undefined, call?: undefined} & (
            R['call'] extends true | CallRequest
                ? {phase: 'Initialization' | 'Finalization'}
                : R['extrinsic'] extends true | ExtrinsicRequest
                    ? {phase: 'Initialization' | 'Finalization'}
                    : {}
        )
    ) | (
        Select<EventScalars, R> & _ApplyExtrinsicFields<R>
    )


export interface EventContextRequest {
    event?: EventRequest | boolean
}


export type EventFields<R extends EventContextRequest> = R['event'] extends true
    ? SubstrateEvent
    : R['event'] extends EventRequest
        ? _EventFields<R['event']>
        : undefined


export type EvmLogFields<R extends EventContextRequest> = R['event'] extends true
    ? EvmLogEvent
    : R['event'] extends EventRequest
        ? _ApplyExtrinsicFields<R['event']> & Select<EventScalars<EvmLogEvent>, R['event']>
        : undefined


export type ContractsContractEmittedFields<R extends EventContextRequest> = R['event'] extends true
    ? ContractsContractEmittedEvent
    : R['event'] extends EventRequest
        ? _ApplyExtrinsicFields<R['event']> & Select<EventScalars<ContractsContractEmittedEvent>, R['event']>
        : undefined
