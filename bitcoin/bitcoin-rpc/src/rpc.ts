import { Logger, createLogger } from "@subsquid/logger"
import {
    CallOptions,
    RpcClient,
    RpcError,
    RpcProtocolError,
} from "@subsquid/rpc-client"
import {
    BYTES,
    DataValidationError,
    GetSrcType,
    NAT,
    nullable,
    object,
    Validator,
} from "@subsquid/util-internal-validation"
import { addErrorContext } from "@subsquid/util-internal"
import assert from "assert"
import { GetBlock, Transaction } from "./rpc-data"
import { Block, DataRequest } from "./types"
import { BareHex, BAREHEX32 } from "./validators"
import { blockHash, coinbaseWitnessCommitment, transactionsRoot, witnessCommitment } from "./verification"

export const DEFAULT_FINALITY_CONFIRMATION = 6

export type Commitment = "finalized" | "latest"

export enum GetBlockVerbosity {
    RawHex = 0,
    Default = 1,
    WithTransactionData = 2,
}

export interface RpcOptions {
    client: RpcClient
    finalityConfirmation?: number
    verifyBlockHash?: boolean
    verifyTxRoot?: boolean
    verifyWitnessCommitment?: boolean
}

export class Rpc {
    private client: RpcClient
    private finalityConfirmation: number
    private verifyBlockHash?: boolean
    private verifyTxRoot?: boolean
    private verifyWitnessCommitment?: boolean
    private log: Logger

    constructor(options: RpcOptions) {
        this.client = options.client
        this.finalityConfirmation = options.finalityConfirmation || DEFAULT_FINALITY_CONFIRMATION
        this.verifyBlockHash = options.verifyBlockHash
        this.verifyTxRoot = options.verifyTxRoot
        this.verifyWitnessCommitment = options.verifyWitnessCommitment
        this.log = createLogger("sqd:bitcoin-rpc")
    }

    getConcurrency(): number {
        return this.client.getConcurrency()
    }

    call<T = any>(
        method: string,
        params?: any[],
        options?: CallOptions<T>,
    ): Promise<T> {
        return this.client.call(method, params, options)
    }

    batchCall<T = any>(
        batch: { method: string; params?: any[] }[],
        options?: CallOptions<T>,
    ): Promise<T[]> {
        return this.client.batchCall(batch, options)
    }

    async getHeight(): Promise<number> {
        return this.call("getblockcount")
    }

    async getLatestBlockhash(commitment: Commitment): Promise<LatestBlockhash> {
        const latestHeight = await this.getHeight()
        const number =
            commitment === "finalized"
                ? Math.max(0, latestHeight - this.finalityConfirmation)
                : latestHeight
        const hash = await this.call("getblockhash", [number], {
            validateResult: getResultValidator(BAREHEX32),
        })
        return { number, hash }
    }

    async getFinalizedBlockBatch(numbers: number[]): Promise<Block[]> {
        let blockhash = await this.getLatestBlockhash("finalized")
        let finalized = numbers.filter((n) => n <= blockhash.number)
        return this.getBlockBatch(finalized)
    }

    async getBlockBatch(numbers: number[], req?: DataRequest): Promise<Block[]> {
        let blocks = await this.getBlocks(numbers, req?.transactions ?? false)

        let chain: Block[] = []

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block == null) break
            if (i > 0 && chain[i - 1].block.hash !== block.block.previousblockhash)
                break
            chain.push(block)
        }

        return chain
    }

    private async getBlockHashes(numbers: number[]): Promise<(BareHex | null)[]> {
        const calls = numbers.map((height) => ({
            method: "getblockhash",
            params: [height],
        }))

        const results = await this.reduceBatchOnRetry(calls, {
            validateResult: getResultValidator(nullable(BAREHEX32)),
            validateError: (info) => {
                // Compatible w/ how EVM RPC works
                if (info.message.includes("Block height out of range")) return null
                throw new RpcError(info)
            },
        })

        return results
    }

    private async getBlocks(
        numbers: number[],
        withTransactions: boolean,
    ): Promise<(Block | null)[]> {
        let blockHashes = await this.getBlockHashes(numbers)
        // Slice blockHashes up to first `null`
        const firstNullIdx = blockHashes.indexOf(null)
        if (firstNullIdx !== -1) {
            blockHashes = blockHashes.slice(0, firstNullIdx)
        }

        const calls = blockHashes
            .filter((hash) => hash !== null)
            .map((hash) => ({
                method: "getblock",
                params: [
                    hash,
                    withTransactions
                        ? GetBlockVerbosity.WithTransactionData
                        : GetBlockVerbosity.Default,
                ],
            }))

        let results = await this.reduceBatchOnRetry(calls, {
            validateResult: getResultValidator(GetBlock),
        })

        let blocks = new Array(numbers.length)
        for (let i = 0; i < numbers.length; i++) {
            if (i < results.length) {
                let block = results[i]
                try {
                    blocks[i] = await this.mapBlock(block, withTransactions)
                } catch (err: any) {
                    throw addErrorContext(err, {
                        blockNumber: block.height,
                        blockHash: block.hash,
                    })
                }
            } else {
                blocks[i] = null
            }
        }

        return blocks
    }

    private async mapBlock(
        block: GetBlock,
        withTransactions: boolean,
    ): Promise<Block> {
        if (this.verifyBlockHash) {
            assert.equal(block.hash, blockHash(block), "failed to verify block hash")
        }

        if (withTransactions) {
            const transactions = block.tx as Transaction[]
            if (this.verifyTxRoot) {
                const txRoot = transactionsRoot(transactions)
                assert.equal(block.merkleroot, txRoot, 'failed to verify transactions root')
            }

            if (this.verifyWitnessCommitment) {
                const commitment = witnessCommitment(transactions)
                if (commitment) {
                    const coinbaseCommitment = coinbaseWitnessCommitment(transactions)
                    assert.equal(
                        commitment,
                        coinbaseCommitment,
                        "failed to verify witness commitment",
                    )
                }
            }
        }
        return {
            number: block.height,
            hash: block.hash,
            block,
        }
    }

    private async reduceBatchOnRetry<T = any>(
        batch: { method: string; params?: any[] }[],
        options: CallOptions<T>,
    ): Promise<T[]> {
        if (batch.length <= 1) return this.batchCall(batch, options)

        let result = await this.batchCall(batch, {
            ...options,
            retryAttempts: 0,
        }).catch((err) => {
            if (this.isRetryableError(err)) {
                this.log.warn(err, "will retry request with reduced batch")
            } else {
                throw err
            }
        })

        if (result != null) return result

        let pack = await Promise.all([
            this.reduceBatchOnRetry(
                batch.slice(0, Math.ceil(batch.length / 2)),
                options,
            ),
            this.reduceBatchOnRetry(
                batch.slice(Math.ceil(batch.length / 2)),
                options,
            ),
        ])

        return pack.flat()
    }

    isRetryableError(err: any): boolean {
        if (this.client.isConnectionError(err)) return true
        if (err instanceof RpcProtocolError) return true
        if (err instanceof RpcError && err.message == "response too large")
            return true
        if (err instanceof RpcError && err.code == 429) return true
        return false
    }
}

const LatestBlockhash = object({
    number: NAT,
    hash: BYTES,
})

export type LatestBlockhash = GetSrcType<typeof LatestBlockhash>

function getResultValidator<V extends Validator>(
    validator: V,
): (result: unknown) => GetSrcType<V> {
    return function (result: unknown) {
        let err = validator.validate(result)
        if (err) {
            throw new DataValidationError(
                `server returned unexpected result: ${err.toString()}`,
            )
        } else {
            return result as GetSrcType<V>
        }
    }
}
