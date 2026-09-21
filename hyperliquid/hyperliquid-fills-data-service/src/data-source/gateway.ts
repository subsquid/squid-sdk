import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {Block} from '@subsquid/hyperliquid-fills-data'
import {AsyncQueue, createFuture, last, wait} from '@subsquid/util-internal'
import {BlockStream} from '@subsquid/util-internal-data-service'
import {assertValidity} from '@subsquid/util-internal-validation'
import assert from 'assert'


export interface IngestBatch {
    blocks: Block[]
}


export interface HyperliquidGatewayOptions {
    blockBufferSize?: number
    subscriptionTimeout?: number
    stalenessThreshold?: number
    stalenessTimeout?: number
}


export class HyperliquidGateway {
    private blockBufferSize: number
    private subscriptionTimeout: number
    private stalenessThreshold: number
    private stalenessTimeout: number
    private log: Logger

    constructor(
        private client: RpcClient,
        options: HyperliquidGatewayOptions = {},
    ) {
        this.blockBufferSize = options.blockBufferSize ?? 10
        assert(this.blockBufferSize > 0)
        this.subscriptionTimeout = options.subscriptionTimeout ?? 10_000
        assert(this.subscriptionTimeout > 0)
        this.stalenessThreshold = options.stalenessThreshold ?? 60_000
        assert(this.stalenessThreshold > 0)
        this.stalenessTimeout = options.stalenessTimeout ?? 60_000
        assert(this.stalenessTimeout > 0)
        this.log = createLogger('sqd:hyperliquid-data-service:gateway')
    }

    async *getStream(from?: number): BlockStream<Block> {
        let queue = new AsyncQueue<IngestBatch | Error>(1)
        let lastBlock: number | undefined

        let run = async () => {
            while (!queue.isClosed()) {
                try {
                    // Resume past what is buffered, not merely past what was consumed:
                    // the queue can still hold blocks the consumer has not reached.
                    let buffered = queue.peek()
                    let resumeAfter = buffered == null || buffered instanceof Error || buffered.blocks.length === 0
                        ? lastBlock
                        : last(buffered.blocks).block_number
                    if (resumeAfter != undefined) {
                        from = resumeAfter + 1
                    }
                    await this.subscribe(queue, from)
                } catch(err: any) {
                    if (lastBlock == null) {
                        queue.forcePut(err)
                        return
                    } else {
                        this.log.error(err)
                        await wait(2000)
                    }
                }
            }
        }

        run().catch()

        for await (let batch of queue.iterate()) {
            if (batch instanceof Error) {
                throw batch
            } else {
                lastBlock = last(batch.blocks).block_number
                yield batch
            }
        }
    }

    private subscribe(queue: AsyncQueue<IngestBatch | Error>, from?: number): Promise<void> {
        let future = createFuture<void>()

        let timer = new Timer(this.subscriptionTimeout, () => {
            future.reject(new SubscriptionError(`no blocks were received during the last ${this.subscriptionTimeout} ms`))
        })

        let bestAge = Infinity
        let staleTimer = new Timer(this.stalenessTimeout, () => {
            future.reject(new SubscriptionError(
                `stream is stale: block age stayed above ${this.stalenessThreshold} ms ` +
                `for ${this.stalenessTimeout} ms without progress`
            ))
        })

        timer.start()

        let handle = this.client.subscribe({
            method: 'gateway_blockFillsSubscribe',
            params: from ? [from] : [],
            notification: 'gateway_blockFillsNotification',
            unsubscribe: 'gateway_blockFillsUnsubscribe',
            onMessage: msg => {
                timer.reset()

                if (msg == null) {
                    future.reject(new SubscriptionError('unexpected end of subscription'))
                    return
                }

                try {
                    assertValidity(Block, msg)
                } catch(err: any) {
                    future.reject(new SubscriptionError(`received invalid block notification: ${err.message}`))
                    return
                }

                let blockAge = Date.now() - Date.parse(msg.block_time)

                if (this.log.isDebug()) {
                    this.log.debug({blockNumber: msg.block_number, blockAge}, 'received')
                }

                // Reset only on a new low: a reopened subscription replays its backlog,
                // and that catch-up must not read as the stall it is curing.
                if (Number.isFinite(blockAge)) {
                    if (blockAge <= this.stalenessThreshold) {
                        bestAge = Infinity
                        staleTimer.stop()
                    } else if (blockAge < bestAge) {
                        bestAge = blockAge
                        staleTimer.reset()
                    } else {
                        staleTimer.start()
                    }
                }

                let batch = queue.peek()
                if (batch == null) {
                    queue.forcePut({blocks: [msg]})
                } else if (batch instanceof Error) {
                } else {
                    batch.blocks.push(msg)
                    if (batch.blocks.length > this.blockBufferSize) {
                        let dropped = batch.blocks.shift()!
                        this.log.info({
                            blockNumber: dropped.block_number,
                            blockAge: Date.now() - Date.parse(dropped.block_time),
                            maxQueueSize: this.blockBufferSize
                        }, 'dropping bottom block, because internal queue has reached its max size')
                    }
                }
            },
            onError: err => {
                future.reject(err)
            }
        });

        function stop() {
            handle.close()
            timer.stop()
            staleTimer.stop()
        }

        queue.addCloseListener(stop)

        return future.promise().finally(() => {
            queue.removeCloseListener(stop)
            stop()
        })
    }
}


class SubscriptionError extends Error {
    get name(): string {
        return 'GatewaySubscriptionError'
    }
}


class Timer {
    private timeout?: any

    constructor(private ms: number, private cb: () => void) {}

    start(): void {
        if (this.timeout != null) return
        this.timeout = setTimeout(() => {
            this.timeout = undefined
            this.cb()
        }, this.ms)
    }

    stop(): void {
        if (this.timeout == null) return
        clearTimeout(this.timeout)
        this.timeout = undefined
    }

    reset(): void {
        this.stop()
        this.start()
    }
}
