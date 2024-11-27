import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {mapRpcBlock, removeVotes} from '@subsquid/solana-normalization'
import * as rpc from '@subsquid/solana-rpc'
import {DataRequest, getBlocks} from '@subsquid/solana-rpc'
import {addErrorContext, assertNotNull, AsyncQueue, concurrentMap, Future, last, wait} from '@subsquid/util-internal'
import {FiniteRange, splitRange} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Chain} from './chain'
import {Block} from './types'
import {isChain} from './util'


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
}


interface BlockWaiter {
    slot: number
    future: Future<void>
}


class SolanaService {
    private listeners: BlockWaiter[] = []
    private rpc: rpc.Rpc
    private websocket?: RpcClient
    private votes: boolean
    private bufferSize: number
    private log: Logger
    private finalityChecks = new AsyncQueue<null>(1)
    #chain?: Chain

    constructor(options: SolanaServiceOptions) {
        this.rpc = new rpc.Rpc(options.httpRpc)
        this.websocket = options.websocketRpc
        this.bufferSize = options.bufferSize ?? 1000
        this.votes = options.votes ?? false
        this.log = options.log ?? createLogger('sqd:solana-data-service')
    }

    private get chain(): Chain {
        assert(this.#chain, 'solana service was not initialized')
        return this.#chain
    }

    private async pollIngestLoop(): Promise<void> {
        let stream = new rpc.PollStream({
            rpc: this.rpc.withPriority(1),
            req: ALL_DATA,
            commitment: 'confirmed',
            from: this.chain.lastSlot() + 1
        })

        while (true) {
            let batch = await stream.next()
            if (batch.length == 0) {
                await wait(50)
            } else {
                let blocks = batch.map(b => this.mapRpcBlock(b))
                await this.receiveNewBlockPack(blocks)
            }
        }
    }

    private async receiveNewBlockPack(blocks: Block[]): Promise<void> {
        for await (let block of blocks) {
            await this.receiveNewBlock(block)
        }
        this.finalityChecks.forcePut(null)
        this.notifyListeners()
    }

    private notifyListeners(): void {
        this.listeners.sort((a, b) => b.slot - a.slot)
        while (
            this.listeners.length > 0 &&
            last(this.listeners).slot <= this.chain.lastSlot()
        ) {
            let future = this.listeners.pop()!.future
            future.resolve()
        }
    }

    private async receiveNewBlock(block: Block): Promise<void> {
        if (block.slot < this.chain.firstSlot()) {
            this.logBlockInfo(block, 'dropping too old block')
            return
        }

        let prev = assertNotNull(this.chain.getFirstBelow(block.slot))

        if (isChain(prev, block)) {
            if (this.chain.lastSlot() < block.slot) {
                this.push(block)
            }
            return
        }

        let missingRange: FiniteRange
        if (prev.slot < block.parentSlot) {
            // missing some blocks
            missingRange = {from: prev.slot + 1, to: block.parentSlot}
        } else {
            let pp = this.chain.getFirstBelow(block.parentSlot)
            if (pp == null || pp.slot < this.chain.lastFinalizedBlock().slot) {
                throw addErrorContext(new Error('rollback beyond finalized head'), {
                    blockSlot: block.slot,
                    blockHash: block.hash
                })
            }
            missingRange = {from: pp.slot + 1, to: block.parentSlot}
        }

        for await (let batch of this.fetchSlots(missingRange)) {
            for (let block of batch) {
                await this.receiveNewBlock(block)
            }
        }

        if (isChain(this.chain.lastBlock(), block)) {
            this.push(block)
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
            blockSlot: block.slot,
            blockHash: block.hash
        }, msg)
    }

    private fetchSlots(slotRange: FiniteRange): AsyncIterable<Block[]> {
        let concurrency = Math.min(10, this.rpc.getConcurrency())

        async function* strides() {
            yield* splitRange(5, slotRange)
        }

        return concurrentMap(
            concurrency,
            strides(),
            range => getBlocks(
                this.rpc.withPriority(range.from),
                'confirmed',
                ALL_DATA,
                range
            ).then(
                batch => batch.map(b => this.mapRpcBlock(b))
            )
        )
    }

    private async finalityChecksLoop(): Promise<void> {
        let rpc = this.rpc.withPriority(2)
        for await (let _ of this.finalityChecks.iterate()) {
            let slots: number[]
            while ((slots = this.chain.getUnfinalizedSlots()).length > 0) {
                // probe up to 5 last slots
                slots = slots.slice(Math.max(0, slots.length - 5))

                let infos = await rpc.getBlockBatch(slots, {
                    commitment: 'finalized',
                    rewards: false,
                    transactionDetails: 'none'
                })

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
            chain.finalize(b.slot, b.hash)
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
            return {
                ...block.header,
                jsonLine: JSON.stringify(block) + '\n'
            }
        } catch(err: any) {
            throw addErrorContext(err, {
                blockSlot: src.slot,
                blockHash: src.block.blockhash,
            })
        }
    }
}
