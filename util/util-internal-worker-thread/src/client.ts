import {createLogger, Logger} from '@subsquid/logger'
import {createFuture, Future} from '@subsquid/util-internal'
import {TransferListItem, Worker} from 'worker_threads'
import {
    Call,
    CallError,
    CallStream,
    CallValue,
    ServerMessage,
    StreamEnd,
    StreamError,
    StreamId,
    StreamItem,
    StreamNext,
    StreamReturn
} from './transport'


export class Client {
    private calls: Map<number, Future<any>> = new Map()
    private streams: Map<number, Stream> = new Map()
    private callCounter = 0
    private closed = false
    private log = createLogger('sqd:worker-thread:client')

    constructor(private worker: Worker) {
        this.worker.on('message', (msg: ServerMessage) => {
            switch(msg.type) {
                case 'call-value':
                    this.onCallValue(msg)
                    break
                case 'call-stream':
                    this.onCallStream(msg)
                    break
                case 'call-error':
                    this.onCallError(msg)
                    break
                case 'stream-item':
                    this.getStream(msg)?.onItem(msg)
                    break
                case 'stream-end':
                    this.getStream(msg)?.onEnd(msg)
                    break
                case 'stream-error':
                    this.getStream(msg)?.onError(msg)
                    break
                default:
                    this.log.error({msg}, 'unknown server message')
            }
        })

        this.worker.on('messageerror', () => {
            this.log.error('failed to receive some message')
        })

        this.worker.on('exit', () => this.cleanup())
        this.worker.on('error', err => {
            this.log.error({err}, 'uncaught exception in worker')
            this.cleanup()
        })
    }

    call(method: string, args: any[], transferList?: TransferListItem[]): Promise<any> {
        if (this.closed) return Promise.reject(new Error('worker terminated'))
        let call = this.callCounter += 1
        let msg: Call = {
            type: 'call',
            call,
            method,
            args
        }
        try {
            this.worker.postMessage(msg, transferList)
        } catch(err: any) {
            return Promise.reject(new Error('failed to serialize call arguments'))
        }
        let future = createFuture()
        this.calls.set(call, future)
        return future.promise()
    }

    close(): void {
        this.worker.terminate().catch(err => {})
        this.cleanup()
    }

    private onCallValue(msg: CallValue): void {
        this.takeCallFuture(msg)?.resolve(msg.value)
    }

    private onCallStream(msg: CallStream): void {
        this.takeCallFuture(msg)?.resolve(
            new Stream(msg.stream, this.worker, this.streams, this.log)
        )
    }

    private onCallError(msg: CallError): void {
        this.takeCallFuture(msg)?.reject(msg.error)
    }

    private takeCallFuture(msg: CallError | CallValue | CallStream): Future<any> | undefined {
        let future = this.calls.get(msg.call)
        if (future == null) {
            this.log.error({msg}, 'got a message for unknown call')
            return
        }
        this.calls.delete(msg.call)
        return future
    }

    private getStream(msg: StreamItem | StreamError | StreamEnd): Stream | undefined {
        let stream = this.streams.get(msg.stream)
        if (stream == null) {
            this.log.error({msg}, 'got a message for unknown stream')
        }
        return stream
    }

    private cleanup(): void {
        for (let fut of this.calls.values()) {
            fut.reject(new Error('worker terminated'))
        }
        for (let stream of this.streams.values()) {
            stream.terminate()
        }
        this.calls.clear()
        this.streams.clear()
    }
}


type StreamState = {
    type: 'free'
} | {
    type: 'next'
    future: Future<IteratorResult<any>>
} | {
    type: 'return'
    future: Future<IteratorResult<any>>
} | {
    type: 'error'
    error: Error
} | {
    type: 'done'
}


class Stream implements AsyncIterableIterator<any> {
    private state: StreamState = {type: 'free'}

    constructor(
        private id: StreamId,
        private worker: Worker,
        private map: Map<number, Stream>,
        private log: Logger
    ) {}

    [Symbol.asyncIterator](): this {
        return this
    }

    next(): Promise<IteratorResult<any>> {
        switch(this.state.type) {
            case 'free':
                let future = createFuture<IteratorResult<any>>()
                this.state = {
                    type: 'next',
                    future
                }
                this.send({
                    type: 'stream-next',
                    stream: this.id
                })
                return future.promise()
            case 'done':
                return Promise.resolve({done: true, value: undefined})
            case 'error':
                return Promise.reject(this.state.error)
            default:
                return Promise.reject(new Error('iterator is busy'))
        }
    }

    return(): Promise<IteratorResult<any>> {
        switch(this.state.type) {
            case 'free':
                let future = createFuture<IteratorResult<any>>()
                this.state = {
                    type: 'return',
                    future
                }
                this.send({
                    type: 'stream-return',
                    stream: this.id
                })
                return future.promise()
            case 'done':
                return Promise.resolve({done: true, value: undefined})
            case 'error':
                return Promise.reject(this.state.error)
            default:
                return Promise.reject(new Error('iterator is busy'))
        }
    }

    terminate(reason?: Error): void {
        switch(this.state.type) {
            case 'error':
            case 'done':
                return
            case 'free':
                this.state = {
                    type: 'error',
                    error: reason ?? new Error('worker terminated')
                }
                return
            case 'next':
            case 'return':
                let error = reason ?? new Error('worker terminated')
                this.state.future.reject(error)
                this.state = {
                    type: 'error',
                    error
                }
                return
        }
    }

    onItem(msg: StreamItem): void {
        if (this.state.type == 'next') {
            this.state.future.resolve({
                value: msg.value
            })
            this.state = {
                type: 'free'
            }
        } else {
            this.logInappropriateMessage(msg)
        }
    }

    onError(msg: StreamError): void {
        switch(this.state.type) {
            case 'next':
            case 'return':
                this.state.future.reject(msg.error)
                this.state = {
                    type: 'error',
                    error: msg.error
                }
                this.map.delete(this.id)
                break
            default:
                this.logInappropriateMessage(msg)
        }
    }

    onEnd(msg: StreamEnd): void {
        switch(this.state.type) {
            case 'next':
                this.state.future.resolve({
                    done: true,
                    value: undefined
                })
                this.finish()
                break
            case 'return':
                this.state.future.resolve({
                    done: true,
                    value: undefined
                })
                this.finish()
                break
            default:
                this.logInappropriateMessage(msg)
        }
    }

    private finish(): void {
        this.state = {type: 'done'}
        this.map.delete(this.id)
    }

    private send(msg: StreamNext | StreamReturn): void {
        this.worker.postMessage(msg)
    }

    private logInappropriateMessage(msg: StreamItem | StreamError | StreamEnd): void {
        this.log.error(
            {msg, state: this.state.type},
            `got '${msg.type}' message from the server, that is inappropriate for the current stream state`
        )
    }
}
