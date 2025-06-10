import {CallOptions, RpcClient, RpcError, RpcProtocolError} from '@subsquid/rpc-client'
import {
    array,
    BYTES,
    DataValidationError,
    GetSrcType,
    NAT,
    nullable,
    object,
    Validator
} from '@subsquid/util-internal-validation'
import {GetBlock, Receipt, TraceFrame, TraceTransactionReplay} from './rpc-data'
import {Block, DataRequest} from './types'
import {qty2Int, toQty, getTxHash} from './util'


export type Commitment = 'finalized' | 'latest'


export class Rpc {
    constructor(
        private client: RpcClient,
        private priority: number = 0,
    ) {
    }

    withPriority(priority: number): Rpc {
        return new Rpc(this.client, priority)
    }

    getConcurrency(): number {
        return this.client.getConcurrency()
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, {priority: this.priority, ...options})
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
        return this.client.batchCall(batch, {priority: this.priority, ...options})
    }

    async getLatestBlockhash(commitment: Commitment): Promise<LatestBlockhash> {
        let block = await this.call('eth_getBlockByNumber', [commitment, false], {
            validateResult: getResultValidator(GetBlock)
        })
        return {
            number: qty2Int(block.number),
            hash: block.hash
        }
    }

    async getFinalizedBlockBatch(numbers: number[]): Promise<Block[]> {
        let blockhash = await this.getLatestBlockhash('finalized')
        let finalized = numbers.filter(n => n <= blockhash.number)
        return this.getBlockBatch(finalized)
    }

    async getBlockBatch(numbers: number[], req?: DataRequest): Promise<Block[]> {
        let blocks = await this.getBlocks(numbers, req?.transactions ?? false)

        let chain: Block[] = []

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block == null) break
            if (i > 0 && chain[i - 1].block.hash !== block.block.parentHash) break
            chain.push(block)
        }

        await this.addRequestedData(chain, req)

        for (let i = 0; i < chain.length; i++) {
            if (chain[i]._isInvalid) return chain.slice(0, i)
        }
        return chain
    }

    private async getBlocks(numbers: number[], withTransactions: boolean): Promise<(Block | null)[]> {
        let call = numbers.map(height => ({
            method: 'eth_getBlockByNumber',
            params: [toQty(height), withTransactions]
        }))

        let blocks = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(nullable(GetBlock)),
            validateError: info => {
                // Avalanche
                if (/cannot query unfinalized data/i.test(info.message)) return null
                throw new RpcError(info)
            }
        })

        return blocks.map(block => {
            if (block == null) return block
            return {
                number: qty2Int(block.number),
                hash: block.hash,
                block
            }
        })
    }

    private async addRequestedData(blocks: Block[], req?: DataRequest) {
        let subtasks = []

        if (req?.receipts) {
            subtasks.push(this.addReceipts(blocks))
        }

        if (req?.traces) {
            subtasks.push(this.addTraces(blocks))
        }

        if (req?.stateDiffs) {
            subtasks.push(this.addStateDiffs(blocks))
        }

        await Promise.all(subtasks)
    }

    private async addReceipts(blocks: Block[]) {
        let call = blocks.map(block => ({
            method: 'eth_getBlockReceipts',
            params: [block.block.number]
        }))

        let results: (Receipt[] | null)[] = await this.batchCall(call, {
            validateResult: getResultValidator(nullable(array(Receipt)))
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let receipts = results[i]
            if (receipts == null) {
                block._isInvalid = true
                continue
            } 

            block.receipts = receipts

            for (let receipt of receipts) {
                if (receipt.blockHash !== block.block.hash) {
                    block._isInvalid = true
                }
            }

            if (block.block.transactions.length !== receipts.length) {
                block._isInvalid = true
            }
        }
    }

    private async addTraces(blocks: Block[]) {
        let call = blocks.map(block => ({
            method: 'trace_block',
            params: [block.block.number]
        }))

        let results = await this.batchCall(call, {
            validateResult: getResultValidator(array(TraceFrame))
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]

            if (frames.length == 0) {
                if (block.block.transactions.length > 0) {
                    block._isInvalid = true
                }
                continue
            }

            for (let frame of frames) {
                if (frame.blockHash !== block.block.hash) {
                    block._isInvalid = true
                    break
                }

                if (!block._isInvalid) {
                    block.traces = frames
                }
            }
        }
    }

    private async addStateDiffs(blocks: Block[]) {
        let tracers = ['stateDiff']

        let call = blocks.map(block => ({
            method: 'trace_replayBlockTransactions',
            params: [block.block.number, tracers]
        }))

        let replaysByBlock = await this.batchCall(call, {
            validateResult: getResultValidator(array(TraceTransactionReplay))
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let replays = replaysByBlock[i]
            let txs = new Set(block.block.transactions.map(getTxHash))

            for (let rep of replays) {
                if (!txs.has(rep.transactionHash)) {
                    block._isInvalid = true
                    break
                }
            }

            block.stateDiffs = replays
        }
    }

    private async reduceBatchOnRetry<T=any>(batch: {method: string, params?: any[]}[], options: CallOptions<T>): Promise<T[]>  {
        if (batch.length <= 1) return this.batchCall(batch, options)

        let result = await this.batchCall(batch, {...options, retryAttempts: 0}).catch(err => {
            if (this.client.isConnectionError(err) || err instanceof RpcProtocolError) return
            throw err
        })

        if (result) return result

        let pack = await Promise.all([
            this.reduceBatchOnRetry(batch.slice(0, Math.ceil(batch.length / 2)), options),
            this.reduceBatchOnRetry(batch.slice(Math.ceil(batch.length / 2)), options),
        ])

        return pack.flat()
    }
}


const LatestBlockhash = object({
    number: NAT,
    hash: BYTES
})


export type LatestBlockhash = GetSrcType<typeof LatestBlockhash>


function getResultValidator<V extends Validator>(validator: V): (result: unknown) => GetSrcType<V> {
    return function(result: unknown) {
        let err = validator.validate(result)
        if (err) {
            throw new DataValidationError(`server returned unexpected result: ${err.toString()}`)
        } else {
            return result as any
        }
    }
}
