import {Logger} from '@subsquid/logger'
import {last, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {HttpRpcClient, RpcCall} from './rpc'
import {Block, HexNumber, Log, rpc} from './types'


export interface IngestOptions {
    rpc: HttpRpcClient
    fromBlock?: number
    toBlock?: number
    concurrency?: number
    log?: Logger
}


export class Ingest {
    static getBlocks(options: IngestOptions): AsyncIterable<Block[]> {
        return new Ingest(options).loop()
    }

    private strides: Promise<Block[]>[] = []
    private strideSize = 10
    private concurrency: number
    private chainHeight = 0
    private height: number
    private end: number


    private constructor(private options: IngestOptions) {
        this.concurrency = options.concurrency || 5
        this.height = (options.fromBlock ?? 0) - 1
        this.end = options.toBlock ?? Infinity
        assert(this.end >= this.height)
    }

    private async *loop(): AsyncGenerator<Block[]> {
        while (this.height < this.end || this.strides.length) {
            let blocks = await this.strides.shift()
            if (blocks == null) {
                await this.waitChain()
                this.scheduleStrides()
            } else {
                this.scheduleStrides()
                yield blocks
            }
        }
    }

    private async waitChain(): Promise<void> {
        if (this.dist() < Math.min(this.strideSize, this.end - this.height)) {
            this.chainHeight = await this.getChainHeight()
        }

        while (this.dist() <= 0) {
            await wait(2000)
            this.chainHeight = await this.getChainHeight()
        }
    }

    private scheduleStrides(): void {
        while (this.strides.length < this.concurrency && this.height < this.end && this.dist() > 0) {
            let fromBlock = this.height + 1
            let toBlock = this.height + Math.min(this.strideSize, this.end - this.height, this.dist())
            let promise = this.fetchStride(fromBlock, toBlock)
            promise.catch(() => {}) // defend against unhandled rejections
            this.strides.push(promise)
            this.height = toBlock
        }
    }

    private dist(): number {
        return this.chainHeight - this.height
    }

    private async fetchStride(fromBlock: number, toBlock: number): Promise<Block[]> {
        let req: RpcCall[] = []
        for (let i = fromBlock; i <= toBlock; i++) {
            req.push({
                method: 'eth_getBlockByNumber',
                params: [
                    '0x'+i.toString(16),
                    true
                ]
            })
        }
        req.push({
            method: 'eth_getLogs',
            params: [{
                fromBlock: '0x'+fromBlock.toString(16),
                toBlock: '0x'+toBlock.toString(16)
            }]
        })

        let response = await this.options.rpc.batch(req)

        let blocks: Block[] = []

        for (let i = 0; i < response.length - 1; i++) {
            let raw = response[i] as rpc.Block
            blocks.push({
                header: {
                    number: Number(raw.number),
                    hash: raw.hash,
                    parentHash: raw.parentHash,
                    nonce: raw.nonce,
                    sha3Uncles: raw.sha3Uncles,
                    logsBloom: raw.logsBloom,
                    transactionsRoot: raw.transactionsRoot,
                    stateRoot: raw.stateRoot,
                    receiptsRoot: raw.receiptsRoot,
                    miner: raw.miner,
                    gasUsed: BigInt(raw.gasUsed),
                    gasLimit: BigInt(raw.gasLimit),
                    size: Number(raw.size),
                    timestamp: Number(raw.timestamp),
                    extraData: raw.extraData
                },
                transactions: raw.transactions.map(tx => {
                    return {
                        blockNumber: Number(tx.blockNumber),
                        transactionIndex: Number(tx.transactionIndex),
                        hash: tx.hash,
                        gas: BigInt(tx.gas),
                        gasPrice: BigInt(tx.gasPrice),
                        from: tx.from,
                        to: tx.to,
                        sighash: tx.input.length >= 10 ? tx.input.slice(0, 10) : undefined,
                        input: tx.input,
                        nonce: BigInt(tx.nonce),
                        value: BigInt(tx.value),
                        v: BigInt(tx.v),
                        s: BigInt(tx.s),
                        r: BigInt(tx.r)
                    }
                }),
                logs: []
            })
        }

        let logs = last(response) as rpc.Log[]
        for (let raw of logs) {
            let log: Log = {
                blockNumber: Number(raw.blockNumber),
                logIndex: Number(raw.logIndex),
                transactionIndex: Number(raw.transactionIndex),
                address: raw.address,
                data: raw.data,
                topic0: raw.topics[0],
                topic1: raw.topics[1],
                topic2: raw.topics[2],
                topic3: raw.topics[3]
            }
            blocks[log.blockNumber - fromBlock].logs.push(log)
        }

        return blocks
    }

    private async getChainHeight(): Promise<number> {
        let hex: HexNumber = await this.options.rpc.call('eth_blockNumber')
        let height = Number(hex)
        assert(Number.isSafeInteger(height))
        return Math.max(height - 10, 0)
    }
}
