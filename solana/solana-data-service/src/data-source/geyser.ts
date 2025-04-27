import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {Block, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {GetBlock} from '@subsquid/solana-rpc-data'
import {AsyncQueue, createFuture, last, wait} from '@subsquid/util-internal'
import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {assertValidity, NAT, object} from '@subsquid/util-internal-validation'
import assert from 'node:assert'


const BlockSchema = object({
    slot: NAT,
    block: GetBlock
})


interface IngestBatch {
    blocks: Block[]
}


export class GeyserDataSource implements DataSource<Block> {
    constructor(
        private rpc: SolanaRpcDataSource,
        private geyserProxy: RpcClient,
        private noVotes: boolean,
        private blockBufferSize = 10,
        private log = createLogger('sqd:solana-data-service:geyser')
    ) {
        assert(this.blockBufferSize > 0)
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.rpc.getFinalizedHead()
    }

    getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        return this.rpc.getFinalizedStream(req)
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        return this.rpc.finalize(
            this.rpc.ensureContinuity(
                this.ingest(),
                req.from,
                req.parentHash,
                req.to
            )
        )
    }

    private async *ingest(): BlockStream<Block> {
        let queue = new AsyncQueue<IngestBatch | Error>(1)
        let yielded = false

        let run = async () => {
            while (!queue.isClosed()) {
                try {
                    await this.subscribe(queue)
                } catch(err: any) {
                    if (yielded) {
                        this.log.error(err)
                        await wait(2000)
                    } else {
                        queue.forcePut(err)
                        return
                    }
                }
            }
        }

        run().catch()

        for await (let batch of queue.iterate()) {
            if (batch instanceof Error) {
                throw batch
            } else {
                yielded = true
                yield batch
            }
        }
    }

    private subscribe(queue: AsyncQueue<IngestBatch | Error>): Promise<void> {
        let future = createFuture<void>()

        let timer = new Timer(10_000, () => {
            future.reject(
                new SubscriptionError('no block where received during the last 10 secs')
            )
        })

        timer.start()

        let handle = this.geyserProxy.subscribe({
            method: 'geyser_blockSubscribe',
            notification: 'geyser_blockNotification',
            unsubscribe: 'geyser_blockUnsubscribe',
            onMessage: msg => {
                timer.reset()

                if (msg == null) {
                    future.reject(new SubscriptionError("unexpected end of subscription"))
                    return
                }

                try {
                    assertValidity(BlockSchema, msg)
                } catch(err: any) {
                    future.reject(new SubscriptionError(`received invalid block notification: ${err.message}`))
                    return
                }

                if (this.log.isDebug()) {
                    this.log.debug({
                        blockSlot: msg.slot,
                        blockHash: msg.block.blockhash,
                        blockAge: msg.block.blockTime == null
                            ? undefined
                            : Date.now() - msg.block.blockTime * 1000
                    }, 'received')
                }

                let batch = queue.peek()
                if (batch == null) {
                    queue.forcePut({blocks: [msg]})
                } else if (batch instanceof Error) {
                } else {
                    let blocks = batch.blocks
                    while (blocks.length > 0) {
                        let head = last(blocks)
                        if (head.slot < msg.block.parentSlot) {
                            break
                        }
                        if (
                            head.slot === msg.block.parentSlot &&
                            head.block.blockhash === msg.block.previousBlockhash
                        ) {
                            break
                        }
                        blocks.pop()
                        this.log.info({
                            dropped: getBlockDescription(head),
                            received: getBlockDescription(msg)
                        }, `dropping current head block, because it is not a parent of newly received one`)
                    }
                    blocks.push(msg)
                    if (blocks.length > this.blockBufferSize) {
                        let dropped = blocks.shift()!
                        this.log.info({
                            ...getBlockDescription(dropped),
                            maxQueueSize: this.blockBufferSize
                        }, `dropping bottom block, because internal queue has reached its max size`)
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

        future.promise().finally(() => {
            queue.removeCloseListener(stop)
            stop()
        })

        return future.promise()
    }
}


function getBlockDescription(block: Block): {blockSlot: number, blockHash: string, blockAge?: number} {
    return {
        blockSlot: block.slot,
        blockHash: block.block.blockhash,
        blockAge: block.block.blockTime == null
            ? undefined
            : Date.now() - block.block.blockTime * 1000
    }
}


class SubscriptionError extends Error {
    get name(): string {
        return "GeyserSubscriptionError"
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
