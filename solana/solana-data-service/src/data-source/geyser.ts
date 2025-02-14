import {Block, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {Base58Bytes, GetBlock, Transaction} from '@subsquid/solana-rpc-data'
import {assertNotNull, AsyncQueue} from '@subsquid/util-internal'
import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import Client, {
    CommitmentLevel,
    SubscribeRequest,
    SubscribeUpdate,
    SubscribeUpdateBlock,
    SubscribeUpdateTransactionInfo
} from '@triton-one/yellowstone-grpc'
import {RewardType} from '@triton-one/yellowstone-grpc/dist/types/grpc/solana-storage'
import * as base58 from 'bs58'
import assert from 'node:assert'


interface IngestBatch {
    blocks: Block[]
}


export class GeyserDataSource implements DataSource<Block> {
    constructor(
        private rpc: SolanaRpcDataSource,
        private geyser: Client
    ) {}

    getFinalizedHead(): Promise<BlockRef> {
        return this.rpc.getFinalizedHead()
    }

    getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        return this.rpc.getFinalizedStream(req)
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        throw new Error()
    }

    private async subscribe(req: StreamRequest, queue: AsyncQueue<IngestBatch>): Promise<void> {
        let stream = await this.geyser.subscribe()

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

        stream.on('data', data => {
            if (!data) return
            let update = data as SubscribeUpdate
            let geyserBlock = update.block
            if (!geyserBlock) return
            let block = mapBlock(geyserBlock)
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
        transactions: g.transactions.map(mapTransaction)
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
            // TODO: https://github.com/rpcpool/yellowstone-grpc/blob/b9f96ae944bb803b7e5c5a5acbdafe525b255566/yellowstone-grpc-proto/src/lib.rs#L193
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
            rewards: meta.rewards.map(reward => {
                return {
                    pubkey: reward.pubkey,
                    lamports: nat(reward.lamports, '.reward.lamports'),
                    postBalance: reward.postBalance,
                    rewardType: mapRewardType(reward.rewardType),
                    commission: reward.commission == null ? undefined : nat(reward.commission, '.reward.commission')
                }
            }),
            returnData: meta.returnData && {
                programId: base58encode(meta.returnData.programId),
                data: [base64encode(meta.returnData.data), 'base64']
            }
        }
    }
}


// FIXME: validate with RPC
function mapRewardType(type: RewardType): string | undefined {
    switch(type) {
        case RewardType.Rent: return 'rent'
        case RewardType.Staking: return 'staking'
        case RewardType.Voting: return 'voting'
        case RewardType.Fee: return 'fee'
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
