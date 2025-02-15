import {createLogger} from '@subsquid/logger'
import {Block, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {Base58Bytes, GetBlock, Reward, Transaction} from '@subsquid/solana-rpc-data'
import {addErrorContext, assertNotNull, AsyncQueue, last, wait} from '@subsquid/util-internal'
import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import Client, {
    CommitmentLevel,
    SubscribeRequest,
    SubscribeUpdate,
    SubscribeUpdateBlock,
    SubscribeUpdateTransactionInfo
} from '@triton-one/yellowstone-grpc'
import type * as grpcType from '@triton-one/yellowstone-grpc/dist/types/grpc/solana-storage'
import * as base58 from 'bs58'
import assert from 'node:assert'


interface IngestBatch {
    blocks: Block[]
}


export class GeyserDataSource implements DataSource<Block> {
    constructor(
        private rpc: SolanaRpcDataSource,
        private geyser: Client,
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
        let queue = new AsyncQueue<IngestBatch>(1)

        this.ingestLoop(req, queue).catch(err => {
            this.log.error(err, 'error occurred, that is not supposed to happen')
        })

        return this.rpc.finalize(
            this.rpc.ensureContinuity(
                queue.iterate(),
                req.from,
                req.parentHash
            )
        )
    }

    private async ingestLoop(req: StreamRequest, queue: AsyncQueue<IngestBatch>): Promise<void> {
        while (!queue.isClosed()) {
            try {
                await this.runSubscription(req, queue)
                queue.close()
            } catch(err: any) {
                this.log.error(err, 'geyser subscription failed')
                await wait(1000)
            }
        }
    }

    private async runSubscription(req: StreamRequest, queue: AsyncQueue<IngestBatch>): Promise<void> {
        let stream = await this.geyser.subscribe()

        if (queue.isClosed()) {
            stream.destroy()
            return
        }

        let request: SubscribeRequest = {
            accounts: {},
            slots: {},
            transactions: {},
            transactionsStatus: {},
            entry: {},
            blocks: {
                client: {
                    accountInclude: [],
                    includeTransactions: this.rpc.req.transactions ?? false,
                }
            },
            blocksMeta: {},
            commitment: CommitmentLevel.PROCESSED,
            accountsDataSlice: [],
            ping: undefined,
        }

        stream.write(request)

        let queueCloseListener: (() => void)

        return new Promise<void>((resolve, reject) => {
            let lastBlock = -1

            stream.on('data', data => {
                if (!data || queue.isClosed()) return
                let update = data as SubscribeUpdate
                let geyserBlock = update.block
                if (!geyserBlock) return

                let block
                try {
                    block = mapBlock(geyserBlock)
                } catch(err: any) {
                    reject(addErrorContext(err, {
                        geyserBlockSlot: geyserBlock.slot,
                        geyserBlockHash: geyserBlock.blockhash
                    }))
                    return
                }

                if (this.log.isDebug()) {
                    this.log.debug({
                        blockSlot: block.slot,
                        blockHash: block.block.blockhash,
                        blockAge: block.block.blockTime == null
                            ? undefined
                            : Date.now() - block.block.blockTime * 1000
                    }, 'received')
                }

                if (block.slot <= lastBlock) {
                    // Such situation (if possible) is likely not going to be about forks.
                    // We'll ensure monotonicity of this stream
                    // to reduce number of edge cases and also
                    // because it is likely the best thing to do.
                    this.log.info(
                        getBlockDescription(block),
                        `ignoring new block, because it is not above the last seen slot`
                    )
                    return
                }
                lastBlock = block.slot

                if (req.from > block.slot) {
                    return
                }

                if (req.to != null && req.to < block.slot) {
                    resolve()
                    return
                }

                let batch = queue.peek()
                if (batch == null) {
                    queue.forcePut({blocks: [block]})
                } else {
                    let blocks = batch.blocks
                    while (blocks.length > 0) {
                        let head = last(blocks)
                        if (head.slot < block.block.parentSlot) {
                            break
                        }
                        if (
                            head.slot === block.block.parentSlot &&
                            head.block.blockhash === block.block.previousBlockhash
                        ) {
                            break
                        }
                        blocks.pop()
                        this.log.info({
                            dropped: getBlockDescription(head),
                            received: getBlockDescription(block)
                        }, `dropping current head block, because it is not a parent of newly received one`)
                    }
                    blocks.push(block)
                    if (blocks.length > this.blockBufferSize) {
                        let dropped = blocks.shift()!
                        this.log.info({
                            ...getBlockDescription(dropped),
                            maxQueueSize: this.blockBufferSize
                        }, `dropping bottom block, because internal queue has reached its max size`)
                    }
                }
            })

            stream.on('error', reject)
            queueCloseListener = resolve
            queue.addCloseListener(queueCloseListener)
        }).finally(() => {
            queue.removeCloseListener(queueCloseListener)
            stream.destroy()
        })
    }
}


function mapBlock(g: SubscribeUpdateBlock): Block {
    let block: GetBlock = {
        blockhash: g.blockhash,
        parentSlot: nat(g.parentSlot, 'parentSlot'),
        previousBlockhash: g.parentBlockhash,
        blockHeight: g.blockHeight == null ? null : nat(g.blockHeight.blockHeight, 'blockHeight'),
        blockTime: g.blockTime == null ? null : nat(g.blockTime.timestamp, 'blockTime'),
        transactions: g.transactions
            // transactions come unordered
            .sort((a, b) => nat(a.index, '.index in geyser transaction') - nat(b.index, '.index in geyser transaction'))
            .map(mapTransaction),
        rewards: g.rewards?.rewards.map(mapReward)
    }
    return {
        slot: nat(g.slot, 'slot'),
        block
    }
}


function mapTransaction(gtx: SubscribeUpdateTransactionInfo): Transaction {
    let tx = assertNotNull(gtx.transaction, 'no .transaction field in geyser transaction')
    let message = assertNotNull(tx.message, 'no .transaction.message field in geyser transaction')
    let header = assertNotNull(message.header, 'no .transaction.message.header field in geyser transaction')
    let meta = assertNotNull(gtx.meta, 'no .meta field in geyser transactions')
    return {
        version: message.versioned ? 1 : 'legacy',
        transaction: {
            message: {
                header,
                accountKeys: message.accountKeys.map(base58encode),
                instructions: message.instructions.map(ins => {
                    return {
                        programIdIndex: ins.programIdIndex,
                        accounts: Array.from(ins.accounts),
                        data: base58encode(ins.data),
                        stackHeight: null
                    }
                }),
                addressTableLookups: message.addressTableLookups.map(lookup => {
                    return {
                        accountKey: base58encode(lookup.accountKey),
                        readonlyIndexes: Array.from(lookup.readonlyIndexes),
                        writableIndexes: Array.from(lookup.writableIndexes)
                    }
                }),
                recentBlockhash: base58encode(message.recentBlockhash)
            },
            signatures: tx.signatures.map(base58encode)
        },
        meta: {
            computeUnitsConsumed: meta.computeUnitsConsumed,
            // FIXME: https://github.com/rpcpool/yellowstone-grpc/blob/b9f96ae944bb803b7e5c5a5acbdafe525b255566/yellowstone-grpc-proto/src/lib.rs#L193
            err: meta.err ? {_geyserEncoded: meta.err.err} : null,
            fee: meta.fee,
            preBalances: meta.preBalances,
            postBalances: meta.postBalances,
            preTokenBalances: meta.preTokenBalances.map(b => {
                let {uiTokenAmount, ...rest} = b
                assert(uiTokenAmount, '.uiTokenAmount should not be null')
                return {...rest, uiTokenAmount}
            }),
            postTokenBalances: meta.preTokenBalances.map(b => {
                let {uiTokenAmount, ...rest} = b
                assert(uiTokenAmount, '.uiTokenAmount should not be null')
                return {...rest, uiTokenAmount}
            }),
            innerInstructions: meta.innerInstructions.map(iis => {
                return {
                    index: iis.index,
                    instructions: iis.instructions.map(ins => {
                        return {
                            accounts: Array.from(ins.accounts),
                            data: base58encode(ins.data),
                            programIdIndex: ins.programIdIndex,
                            stackHeight: ins.stackHeight ?? null
                        }
                    })
                }
            }).sort((a, b) => a.index - b.index),
            loadedAddresses: {
                readonly: meta.loadedReadonlyAddresses.map(base58encode),
                writable: meta.loadedWritableAddresses.map(base58encode)
            },
            logMessages: meta.logMessages,
            rewards: meta.rewards.map(mapReward),
            returnData: meta.returnData && {
                programId: base58encode(meta.returnData.programId),
                data: [base64encode(meta.returnData.data), 'base64']
            }
        }
    }
}


function mapReward(reward: grpcType.Reward): Reward {
    return {
        pubkey: reward.pubkey,
        lamports: nat(reward.lamports, '.reward.lamports'),
        postBalance: reward.postBalance,
        rewardType: mapRewardType(reward.rewardType),
        commission: reward.commission ? nat(reward.commission, '.reward.commission') : null
    }
}


// FIXME: validate with RPC
function mapRewardType(type: grpcType.RewardType): string | undefined {
    switch(type) {
        case 1: return 'fee'
        case 2: return 'rent'
        case 3: return 'staking'
        case 4: return 'voting'
        default: return undefined
    }
}


function nat(s: string, loc: string): number {
    let val = parseInt(s)
    if (Number.isSafeInteger(val)) return val
    throw new Error(`invalid ${loc}: ${s}`)
}


// wrapping to pass to array.map() safely
function base58encode(val: Uint8Array): Base58Bytes {
    return base58.encode(val)
}


function base64encode(val: Uint8Array): string {
    return Buffer.from(val.buffer, val.byteOffset, val.byteLength).toString('base64')
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
