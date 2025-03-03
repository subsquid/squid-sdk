import {createLogger} from '@subsquid/logger'
import {ensureError} from '@subsquid/util-internal'
import {MessagePort} from 'worker_threads'
import {Transfer} from './transfer'
import {Call, CallId, ClientMessage, ServerMessage, StreamId, StreamNext, StreamReturn} from './transport'


export type Method = (...args: any[]) => any


export class Server {
    private methods: Record<string, Method> = {}
    private streams: Map<StreamId, AsyncIterator<any>> = new Map()
    private streamsCounter = 0
    private started = false
    private closed = false
    private log = createLogger('sqd:worker-thread:server')

    constructor(private port: MessagePort) {}

    def(name: string, method: Method): this {
        this.methods[name] = method
        return this
    }

    start(): void {
        if (this.started) return
        this.started = true

        this.port.on('message', (msg: ClientMessage) => {
            // this.log.debug({message: msg}, 'receive')
            switch(msg.type) {
                case 'call':
                    this.onCall(msg)
                    break
                case 'stream-next':
                    this.onStreamNext(msg)
                    break
                case 'stream-return':
                    this.onStreamReturn(msg)
                    break
                default:
                    this.log.error({message: msg}, 'got unexpected client message')
            }
        })

        this.port.on('messageerror', () => {
            this.log.error('failed to receive some message')
        })

        this.port.on('close', () => {
            this.closed = true
            for (let it of this.streams.values()) {
                this.finishStream(it).catch(err => {
                    this.log.error(err, 'stream cleanup failed')
                })
            }
            this.streams.clear()
            this.methods = {}
        })
    }

    private onCall(event: Call): void {
        let method = this.methods[event.method]
        if (method == null) {
            return this.send({
                type: 'call-error',
                call: event.call,
                error: new Error(`unknown method: '${event.method}'`)
            })
        }
        this.call(event.call, method, event.args).then(
            msg => this.send(msg)
        )
    }

    private async call(
        call: CallId,
        method: Method,
        args: any[]
    ): Promise<ServerMessage | Transfer<ServerMessage>>
    {
        try {
            let result = await method(...args)

            if (typeof result?.[Symbol.asyncIterator] == 'function') {
                let iterator = result[Symbol.asyncIterator]()
                let stream = this.streamsCounter += 1
                this.streams.set(stream, iterator)
                return {
                    type: 'call-stream',
                    call,
                    stream
                }
            }

            return Transfer.map(result, value => {
                return {
                    type: 'call-value',
                    call,
                    value
                }
            })
        } catch(err: any) {
            return {
                type: 'call-error',
                call,
                error: ensureError(err)
            }
        }
    }

    private onStreamNext(event: StreamNext): void {
        let it = this.streams.get(event.stream)
        if (it == null) return this.send({
            type: 'stream-error',
            stream: event.stream,
            error: new Error(`stream ${event.stream} does not exist`)
        })
        this.streamNext(event.stream, it).then(msg => this.send(msg))
    }

    private async streamNext(id: StreamId, it: AsyncIterator<any>): Promise<ServerMessage | Transfer<ServerMessage>> {
        let item: IteratorResult<any>
        try {
            item = await it.next()
        } catch(err: any) {
            this.streams.delete(id)
            return {
                type: 'stream-error',
                stream: id,
                error: err
            }
        }

        if (item.done) {
            this.streams.delete(id)
            return {
                type: 'stream-end',
                stream: id
            }
        }

        return Transfer.map(item.value, value => {
            return {
                type: 'stream-item',
                stream: id,
                value
            }
        })
    }

    private onStreamReturn(event: StreamReturn): void {
        let it = this.streams.get(event.stream)
        if (it == null) {
            this.log.error(`got return request for unknown stream ${event.stream}`)
            this.send({
                type: 'stream-end',
                stream: event.stream
            })
        } else {
            this.streams.delete(event.stream)
            this.finishStream(it).then(
                () => this.send({
                    type: 'stream-end',
                    stream: event.stream
                }),
                err => this.send({
                    type: 'stream-error',
                    stream: event.stream,
                    error: err
                })
            )
        }
    }

    private async finishStream(it: AsyncIterator<any>): Promise<void> {
        await it.return?.()
    }

    private send(msg: ServerMessage | Transfer<ServerMessage>): void {
        if (this.closed) return
        // this.log.debug({message: msg}, 'send')
        try {
            Transfer.send(this.port, msg)
        } catch(err: any) {
            this.handleSerializationFailure(Transfer.value(msg))
        }
    }

    private handleSerializationFailure(msg: ServerMessage): void {
        switch(msg.type) {
            case 'stream-error':
                this.send({
                    type: 'stream-error',
                    stream: msg.stream,
                    error: new Error(`stream failed with unserializable error, stack: ${msg.error?.stack}`)
                })
                break
            case 'call-error':
                this.send({
                    type: 'call-error',
                    call: msg.call,
                    error: new Error(`call failed with unserializable error, stack: ${msg.error?.stack}`)
                })
                break
            case 'call-value':
                this.send({
                    type: 'call-error',
                    call: msg.call,
                    error: new Error('failed to serialize call result')
                })
                break
            case 'stream-item': {
                this.send({
                    type: 'stream-error',
                    stream: msg.stream,
                    error: new Error('stream sent unserializable item')
                })
                let it = this.streams.get(msg.stream)
                if (it) {
                    this.streams.delete(msg.stream)
                    this.finishStream(it).catch(err => {
                        this.log.error(err, 'stream cleanup failed')
                    })
                }
                break
            }
            default:
                this.log.error('unhandled serialization failure')
        }
    }
}
