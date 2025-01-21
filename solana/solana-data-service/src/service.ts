import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient, SubscriptionHandle} from '@subsquid/rpc-client'
import {mapRpcBlock, removeVotes} from '@subsquid/solana-normalization'
import * as rpc from '@subsquid/solana-rpc'
import {DataRequest, getBlocks, ingest, isBlockNotificationError, subscribeNewBlocks} from '@subsquid/solana-rpc'
import {
    addErrorContext,
    assertNotNull,
    AsyncQueue,
    bisect,
    concurrentMap,
    createFuture,
    Future,
    last,
    removeArrayItem,
    splitArray
} from '@subsquid/util-internal'
import {toJSON} from '@subsquid/util-internal-json'
import {FiniteRange, splitRange} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Chain, InvalidBaseBlock} from './chain'
import {Block, BlockRef} from './types'
import {isChain, Timeout} from './util'


export interface Response {
    finalizedHead: BlockRef
    blocks: Block[]
    blockStream?: AsyncIterable<Block[]>
}


const ALL_DATA: DataRequest = {
    transactions: true,
    rewards: true
}


export interface SolanaServiceOptions {
    votes?: boolean
    httpRpc: RpcClient
    websocketRpc?: RpcClient
    bufferSize?: number
    log?: Logger
    newBlockTimeout?: number
}


interface BlockWaiter {
    number: number
    future: Future<void>
}


export class SolanaService {
    private listeners: BlockWaiter[] = []
    private rpc: rpc.Rpc
    private websocket?: RpcClient
    private votes: boolean
    private bufferSize: number
    private newBlockTimeout: number
    private log: Logger
    private finalityChecks = new AsyncQueue<null>(1)
    private newBlocks = new AsyncQueue<Block[]>(1)
    #chain?: Chain

    constructor(options: SolanaServiceOptions) {
        this.rpc = new rpc.Rpc(options.httpRpc)
        this.websocket = options.websocketRpc
        this.bufferSize = options.bufferSize ?? 100
        this.newBlockTimeout = options.newBlockTimeout ?? 10000
        this.votes = options.votes ?? false
        this.log = options.log ?? createLogger('sqd:solana-data-service')
    }

    private get chain(): Chain {
        assert(this.#chain, 'solana service is not initialized')
        return this.#chain
    }

    getFinalizedHead(): BlockRef {
        return this.chain.getFinalizedHead()
    }

    getHead(): BlockRef {
        return this.chain.getHead()
    }

    async query(from: number, baseBlockHash?: string): Promise<Response | InvalidBaseBlock> {
        if (from < this.chain.firstSlot()) {
            return this.belowQuery(from, baseBlockHash)
        } else {
            let res = this.queryChain(from, baseBlockHash)
            if (res instanceof InvalidBaseBlock) return res
            if (res.blocks.length > 0) return res
            await this.waitForBlock(from)
            return this.queryChain(from, baseBlockHash)
        }
    }

    private queryChain(from: number, baseBlockHash?: string): Response | InvalidBaseBlock {
        let blocks = this.chain.query(100, from, baseBlockHash)
        if (blocks instanceof InvalidBaseBlock) return blocks
        return {
            finalizedHead: this.chain.getFinalizedHead(),
            blocks
        }
    }

    private async belowQuery(from: number, baseBlockHash?: string): Promise<Response | InvalidBaseBlock> {
        let rpc = this.rpc.withPriority(10)

        // we first fetch all slot numbers to guarantee some block-based progress
        // (instead of probing undefined number of successive slots)
        let slots = await rpc.getBlocksWithLimit('finalized', from, 100)
        assert(slots.length > 0, 'RPC node felt too far behind the head')

        let blocks: Block[] = []

        if (baseBlockHash != null) {
            let firstBlock = await getBlocks(
                rpc,
                'finalized',
                ALL_DATA,
                [slots[0]]
            ).then(
                b => this.mapRpcBlock(b[0])
            )

            if (firstBlock.parentHash !== baseBlockHash) return new InvalidBaseBlock([{
                number: firstBlock.parentNumber,
                hash: firstBlock.parentHash
            }])

            blocks.push(firstBlock)
        }

        let finalizedHead = this.chain.getFinalizedHead()

        let pos = bisect(slots, this.chain.firstSlot(), (a, b) => a - b)
        let missingSlots = slots.slice(blocks.length, pos)
        let presentSlots = slots.slice(pos).filter(s => s <= finalizedHead.number)

        let present = presentSlots.length > 0
            ? this.chain.query(presentSlots.length, presentSlots[0])
            : []

        let self = this

        async function* blockStream(): AsyncIterable<Block[]> {
            let concurrency = Math.min(5, rpc.getConcurrency())

            let missing = concurrentMap(
                concurrency,
                splitArray(5, missingSlots),
                slots => getBlocks(
                    rpc,
                    'finalized',
                    ALL_DATA,
                    slots
                ).then(
                    blocks => blocks.map(b => self.mapRpcBlock(b))
                )
            )

            let prev: Block | undefined = blocks[0]

            for await (let batch of missing) {
                for (let i = 0; i < batch.length; i++) {
                    let b = batch[i]
                    if (prev && !isChain(prev, b)) {
                        self.logContinuityViolation(prev, b)
                        if (i > 0) {
                            // yield blocks to ensure progress
                            yield batch.slice(0, i)
                        }
                        return
                    }
                    prev = b
                }
                yield batch
            }

            if (present.length == 0) return

            let firstPresent = present[0]
            if (prev && !isChain(prev, firstPresent)) {
                self.logContinuityViolation(prev, firstPresent)
            } else {
                yield present
            }
        }

        return {
            finalizedHead,
            blocks,
            blockStream: blockStream()
        }
    }

    private logContinuityViolation(a: BlockRef, b: BlockRef): void {
        this.log.error(`chain continuity was violated between ${a.number}#${a.hash} and ${b.number}#${b.hash}`)
    }

    private waitForBlock(number: number): Promise<void> {
        let future = createFuture<void>()
        let listener = {number, future}
        this.listeners.push(listener)

        let timer = setTimeout(() => {
            removeArrayItem(this.listeners, listener)
            future.resolve()
        }, 10000)

        return future.promise().finally(() => clearTimeout(timer))
    }

    private async httpIngestLoop(): Promise<void> {
        let stream = ingest({
            rpc: this.rpc.withPriority(5),
            commitment: 'confirmed',
            req: ALL_DATA,
            range: {from: this.chain.lastSlot() + 1}
        })

        for await (let batch of stream) {
            let blocks = batch.map(b => this.mapRpcBlock(b))
            await this.newBlocks.put(blocks)
        }
    }

    private websocketIngestLoop(): Promise<void> {
        assert(this.websocket, 'websocket RPC is not defined')
        let websocket = this.websocket

        let handle: SubscriptionHandle | undefined

        let newBlockTimeout = new Timeout(10000, () => {
            this.log.warn('have not received new block for more than 10 secs')
            handle?.reset()
        })

        return new Promise<void>((resolve, reject) => {
            handle = subscribeNewBlocks(
                websocket,
                'confirmed',
                ALL_DATA,
                msg => {
                    if (isBlockNotificationError(msg)) {
                        this.log.error(msg)
                        return
                    }

                    if (msg instanceof Error) {
                        this.newBlocks.removeCloseListener(resolve)
                        reject(msg)
                        return
                    }

                    let block: Block
                    try {
                        block = this.mapRpcBlock(msg)
                    } catch(err: any) {
                        this.log.error(err)
                        return
                    }
                    newBlockTimeout.reset()
                    this.enqueue(block)
                }
            )

            newBlockTimeout.start()
            this.newBlocks.addCloseListener(resolve)

        }).finally(() => {
            handle?.close()
            newBlockTimeout.stop()
        })
    }

    private enqueue(block: Block): void {
        if (this.newBlocks.isClosed()) return
        let queue = this.newBlocks.peek()
        if (queue) {
            if (queue.length < 20) {
                queue.push(block)
            } else {
                queue[queue.length - 1] = block
            }
        } else {
            this.newBlocks.forcePut([block])
        }
    }

    private async receiveLoop(): Promise<void> {
        for await (let batch of this.newBlocks.iterate()) {
            for await (let block of batch) {
                await this.receiveNewBlock(block)
            }
            if (!this.chain.compact()) {
                this.log.error('block finalization lags behind and prevents buffer compaction')
            }
            this.finalityChecks.forcePut(null)
            this.notifyListeners()
        }
    }

    private notifyListeners(): void {
        this.listeners.sort((a, b) => b.number - a.number)
        while (
            this.listeners.length > 0 &&
            last(this.listeners).number <= this.chain.lastSlot()
        ) {
            let future = this.listeners.pop()!.future
            future.resolve()
        }
    }

    private async receiveNewBlock(block: Block): Promise<void> {
        if (block.number < this.chain.firstSlot()) {
            this.logBlockInfo(block, 'dropping too old block')
            return
        }

        let prev = assertNotNull(this.chain.getFirstBelow(block.number))

        if (isChain(prev, block)) {
            if (this.chain.lastSlot() < block.number) {
                this.push(block)
            }
            return
        }

        let missingRange: FiniteRange
        if (prev.number < block.parentNumber) {
            // missing some blocks
            missingRange = {from: prev.number + 1, to: block.parentNumber}
        } else {
            let pp = this.chain.getFirstBelow(block.parentNumber)
            if (pp == null || pp.number < this.chain.getFinalizedHead().number) {
                throw addErrorContext(new Error('rollback beyond finalized head'), {
                    blockSlot: block.number,
                    blockHash: block.hash
                })
            }
            missingRange = {from: pp.number + 1, to: block.parentNumber}
        }

        for await (let batch of this.fetchMissingBlockRange(missingRange)) {
            for (let block of batch) {
                await this.receiveNewBlock(block)
            }
        }

        if (isChain(this.chain.lastBlock(), block)) {
            this.push(block)
        } else if (this.chain.lastSlot() < block.parentNumber) {
            this.logBlockInfo(block, 'dropping early block')
        } else {
            this.logBlockInfo(block, 'dropping forked block')
        }
    }

    private push(block: Block): void {
        this.chain.push(block)
        this.logBlockInfo(block, 'new block accepted')
    }

    private logBlockInfo(block: Block, msg: string): void {
        this.log.info({
            blockSlot: block.number,
            blockHash: block.hash,
            blockAge: block.timestamp && Date.now() - block.timestamp,
        }, msg)
    }

    private fetchMissingBlockRange(range: FiniteRange): AsyncIterable<Block[]> {
        let concurrency = Math.min(5, this.rpc.getConcurrency())

        async function* strides() {
            yield* splitRange(5, range)
        }

        return concurrentMap(
            concurrency,
            strides(),
            range => getBlocks(
                this.rpc,
                'confirmed',
                ALL_DATA,
                range
            ).then(
                batch => batch.map(b => this.mapRpcBlock(b))
            )
        )
    }

    private async finalityChecksLoop(): Promise<void> {
        let rpc = this.rpc.withPriority(1)
        for await (let _ of this.finalityChecks.iterate()) {
            let slots: number[]
            while ((slots = this.chain.getUnfinalizedSlots()).length > 0) {
                // probe up to 5 first slots
                slots = slots.slice(0, 5)

                let infos = await rpc.getBlockBatch(slots, {
                    commitment: 'finalized',
                    rewards: false,
                    transactionDetails: 'none'
                })

                if (this.log.isDebug()) {
                    this.log.debug(
                        infos.map((m, i) => ({slot: slots[i], final: !!m})),
                        'probe result'
                    )
                }

                for (let i = infos.length - 1; i >= 0; i--) {
                    let info = infos[i]
                    if (info == null) continue
                    let slot = slots[i]
                    if (this.chain.finalize(slot, info.blockhash)) {
                        this.log.info({
                            blockSlot: slot,
                            blockHash: info.blockhash
                        }, 'finalized')
                        break
                    }
                }
            }
        }
    }

    private async createChain(): Promise<Chain> {
        let {context: {slot}} = await this.rpc.getLatestBlockhash('finalized')

        let stream = new rpc.PollStream({
            rpc: this.rpc,
            req: {transactions: true, rewards: true},
            commitment: 'finalized',
            from: slot,
        })

        let rpcBlocks: rpc.Block[]
        do {
            rpcBlocks = await stream.next()
        } while (rpcBlocks.length == 0)

        let blocks = rpcBlocks.map(b => this.mapRpcBlock(b))

        let chain = new Chain(blocks[0], this.bufferSize)
        for (let i = 1; i < blocks.length; i++) {
            let b = blocks[i]
            chain.push(b)
            chain.finalize(b.number, b.hash)
        }
        return chain
    }

    private mapRpcBlock(src: rpc.Block): Block {
        try {
            assert(src.slot > src.block.parentSlot)
            let block = mapRpcBlock(src.slot, src.block)
            if (!this.votes) {
                removeVotes(block)
            }

            let {header, ...items} = block
            let {slot, parentSlot, ...props} = header

            let jsonLine = JSON.stringify(toJSON({
                header: {
                    number: slot,
                    parentNumber: parentSlot,
                    ...props
                },
                ...items
            })) + '\n'

            return {
                number: block.header.slot,
                hash: block.header.hash,
                parentNumber: block.header.parentSlot,
                parentHash: block.header.parentHash,
                timestamp: block.header.timestamp * 1000,
                isFinal: src.isFinal,
                jsonLine,
                jsonLineByteLength: Buffer.byteLength(jsonLine)
            }
        } catch(err: any) {
            throw addErrorContext(err, {
                blockSlot: src.slot,
                blockHash: src.block.blockhash,
            })
        }
    }

    async init(): Promise<void> {
        this.#chain = await this.createChain()
    }

    async run(): Promise<void> {
        await Promise.race([
            this.websocket ? this.websocketIngestLoop() : this.httpIngestLoop(),
            this.receiveLoop(),
            this.finalityChecksLoop()
        ]).finally(() => {
            this.finalityChecks.close()
            this.newBlocks.close()
        })
    }
}
