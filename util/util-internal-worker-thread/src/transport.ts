export type StreamId = number
export type CallId = number


export type ClientMessage = Call | StreamNext | StreamReturn
export type ServerMessage = CallValue | CallStream | CallError | StreamItem | StreamError | StreamEnd


export interface Call {
    type: 'call'
    call: CallId
    method: string
    args: any[]
}


export interface CallValue {
    type: 'call-value'
    call: CallId
    value: any
}


export interface CallStream {
    type: 'call-stream'
    call: CallId
    stream: StreamId
}


export interface CallError {
    type: 'call-error'
    call: CallId
    error: Error
}


export interface StreamNext {
    type: 'stream-next'
    stream: StreamId
}


export interface StreamReturn {
    type: 'stream-return'
    stream: StreamId
}


export interface StreamItem {
    type: 'stream-item'
    stream: StreamId
    value: any
}


export interface StreamError {
    type: 'stream-error'
    stream: StreamId
    error: Error
}


export interface StreamEnd {
    type: 'stream-end'
    stream: StreamId
}
