import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {ReplicaBlock, Block} from '@subsquid/hyperliquid-replica-cmds-data'
import {AsyncQueue, createFuture, last, wait} from '@subsquid/util-internal'
import {BlockStream} from '@subsquid/util-internal-data-service'
import {assertValidity, object, NAT} from '@subsquid/util-internal-validation'
import assert from 'assert'


export const LatestBlockNumber = object({
    block_number: NAT,
})


export interface IngestBatch {
    blocks: Block[]
}


export class HyperliquidGateway {
    constructor(
        private client: RpcClient,
        private blockBufferSize = 10,
        private log = createLogger('sqd:hyperliquid-data-service:gateway')
    ) {
        assert(this.blockBufferSize > 0)
    }

    async getFinalizedHeight(): Promise<number> {
        let block = await this.client.call('gateway_getBlockFills', [])
        assertValidity(LatestBlockNumber, block)
        return block.block_number
    }

    async *getStream(from: number): BlockStream<Block> {
        let queue = new AsyncQueue<IngestBatch | Error>(1)
        let lastBlock: number | undefined

        let run = async () => {
            while (!queue.isClosed()) {
                try {
                    if (lastBlock != undefined) {
                        from = lastBlock + 1
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
                lastBlock = last(batch.blocks).height
                yield batch
            }
        }
    }

    private subscribe(queue: AsyncQueue<IngestBatch | Error>, from: number): Promise<void> {
        let future = createFuture<void>()

        let timer = new Timer(10_000, () => {
            future.reject(new SubscriptionError('no blocks were received during the last 10 secs'))
        })

        timer.start()

        let height = from
        let handle = this.client.subscribe({
            method: 'gateway_blockReplicaCmdsSubscribe',
            params: [from],
            notification: 'gateway_blockReplicaCmdsNotification',
            unsubscribe: 'gateway_blockReplicaCmdsUnsubscribe',
            onMessage: msg => {
                timer.reset()

                if (msg == null) {
                    future.reject(new SubscriptionError('unexpected end of subscription'))
                    return
                }

                try {
                    assertValidity(ReplicaBlock, msg)
                } catch(err: any) {
                    future.reject(new SubscriptionError(`received invalid block notification: ${err.message}`))
                    return
                }

                let block: Block = {
                    height: height++,
                    block: msg
                }

                if (this.log.isDebug()) {
                    this.log.debug({
                        blockNumber: block.height,
                        blockAge: Date.now() - Date.parse(block.block.abci_block.time)
                    }, 'received')
                }

                let batch = queue.peek()
                if (batch == null) {
                    queue.forcePut({blocks: [block]})
                } else if (batch instanceof Error) {
                } else {
                    batch.blocks.push(block)
                    if (batch.blocks.length > this.blockBufferSize) {
                        let dropped = batch.blocks.shift()!
                        this.log.info({
                            blockNumber: dropped.height,
                            blockAge: Date.now() - Date.parse(dropped.block.abci_block.time),
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
