import {createLogger} from '@subsquid/logger'
import {Block, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {Base58Bytes, GetBlock, Reward, Transaction} from '@subsquid/solana-rpc-data'
import {addErrorContext, assertNotNull, AsyncQueue, last, wait} from '@subsquid/util-internal'
import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import Client, {
    CommitmentLevel,
    Reward as GeyserReward,
    RewardType,
    SubscribeRequest,
    SubscribeUpdate,
    SubscribeUpdateBlock,
    SubscribeUpdateTransactionInfo
} from '@subsquid/util-internal-geyser-client'
import * as base58 from 'bs58'
import assert from 'node:assert'
import * as borsh from '@subsquid/borsh'


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
            this.log.debug('subscription destroyed')
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
            .map(mapTransaction)
            // transactions come unordered
            .sort((a, b) => a[kIndex] - b[kIndex]),
        rewards: g.rewards?.rewards.map(mapReward)
    }
    return {
        slot: nat(g.slot, 'slot'),
        block
    }
}


const kIndex = Symbol('index')


function mapTransaction(gtx: SubscribeUpdateTransactionInfo): Transaction & {[kIndex]: number} {
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
            err: meta.err ? mapTransactionError(meta.err.err) : null,
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
        },
        [kIndex]: nat(gtx.index, '.index in geyser transaction')
    }
}


function mapTransactionError(data: Uint8Array): any {
    let error = TransactionErrorCodec.decode(new borsh.Src(data))

    switch (error.kind) {
        case 'InstructionError':
            return {
                [error.kind]: [error.value[0], normalizeEnum(error.value[1])],
            }
        default:
            return normalizeEnum(error)
    }
}


function mapReward(reward: GeyserReward): Reward {
    return {
        pubkey: reward.pubkey,
        lamports: nat(reward.lamports, '.reward.lamports'),
        postBalance: reward.postBalance,
        rewardType: mapRewardType(reward.rewardType),
        commission: reward.commission ? nat(reward.commission, '.reward.commission') : null
    }
}


function mapRewardType(type: RewardType): string | undefined {
    switch(type) {
        case RewardType.Fee: return 'fee'
        case RewardType.Rent: return 'rent'
        case RewardType.Staking: return 'staking'
        case RewardType.Voting: return 'voting'
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


// ref: https://github.com/anza-xyz/agave/blob/164f6a14a72817810db8443ed4263a526bac1482/sdk/instruction/src/error.rs#L64
const InstructionErrorCodec = borsh.sum(4, {
    GenericError: {discriminator: 0, value: borsh.unit},
    InvalidArgument: {discriminator: 1, value: borsh.unit},
    InvalidInstructionData: {discriminator: 2, value: borsh.unit},
    InvalidAccountData: {discriminator: 3, value: borsh.unit},
    AccountDataTooSmall: {discriminator: 4, value: borsh.unit},
    InsufficientFunds: {discriminator: 5, value: borsh.unit},
    IncorrectProgramId: {discriminator: 6, value: borsh.unit},
    MissingRequiredSignature: {discriminator: 7, value: borsh.unit},
    AccountAlreadyInitialized: {discriminator: 8, value: borsh.unit},
    UninitializedAccount: {discriminator: 9, value: borsh.unit},
    UnbalancedInstruction: {discriminator: 10, value: borsh.unit},
    ModifiedProgramId: {discriminator: 11, value: borsh.unit},
    ExternalAccountLamportSpend: {discriminator: 12, value: borsh.unit},
    ExternalAccountDataModified: {discriminator: 13, value: borsh.unit},
    ReadonlyLamportChange: {discriminator: 14, value: borsh.unit},
    ReadonlyDataModified: {discriminator: 15, value: borsh.unit},
    DuplicateAccountIndex: {discriminator: 16, value: borsh.unit},
    ExecutableModified: {discriminator: 17, value: borsh.unit},
    RentEpochModified: {discriminator: 18, value: borsh.unit},
    NotEnoughAccountKeys: {discriminator: 19, value: borsh.unit},
    AccountDataSizeChanged: {discriminator: 20, value: borsh.unit},
    AccountNotExecutable: {discriminator: 21, value: borsh.unit},
    AccountBorrowFailed: {discriminator: 22, value: borsh.unit},
    AccountBorrowOutstanding: {discriminator: 23, value: borsh.unit},
    DuplicateAccountOutOfSync: {discriminator: 24, value: borsh.unit},
    Custom: {discriminator: 25, value: borsh.u32},
    InvalidError: {discriminator: 26, value: borsh.u32},
    ExecutableDataModified: {discriminator: 27, value: borsh.unit},
    ExecutableLamportChange: {discriminator: 28, value: borsh.unit},
    ExecutableAccountNotRentExempt: {discriminator: 29, value: borsh.unit},
    UnsupportedProgramId: {discriminator: 30, value: borsh.unit},
    CallDepth: {discriminator: 31, value: borsh.unit},
    MissingAccount: {discriminator: 32, value: borsh.unit},
    ReentrancyNotAllowed: {discriminator: 33, value: borsh.unit},
    MaxSeedLengthExceeded: {discriminator: 34, value: borsh.unit},
    InvalidSeeds: {discriminator: 35, value: borsh.unit},
    InvalidRealloc: {discriminator: 36, value: borsh.unit},
    ComputationalBudgetExceeded: {discriminator: 37, value: borsh.unit},
    PrivilegeEscalation: {discriminator: 38, value: borsh.unit},
    ProgramEnvironmentSetupFailure: {discriminator: 39, value: borsh.unit},
    ProgramFailedToComplete: {discriminator: 40, value: borsh.unit},
    ProgramFailedToCompile: {discriminator: 41, value: borsh.unit},
    Immutable: {discriminator: 42, value: borsh.unit},
    IncorrectAuthority: {discriminator: 43, value: borsh.unit},
    BorshIoError: {discriminator: 44, value: borsh.string},
    AccountNotRentExempt: {discriminator: 45, value: borsh.unit},
    InvalidAccountOwner: {discriminator: 46, value: borsh.unit},
    ArithmeticOverflow: {discriminator: 47, value: borsh.unit},
    UnsupportedSysvar: {discriminator: 48, value: borsh.unit},
    IllegalOwner: {discriminator: 49, value: borsh.unit},
    MaxAccountsDataAllocationsExceeded: {discriminator: 50, value: borsh.unit},
    MaxAccountsExceeded: {discriminator: 51, value: borsh.unit},
    MaxInstructionTraceLengthExceeded: {discriminator: 52, value: borsh.unit},
    BuiltinProgramsMustConsumeComputeUnits: {discriminator: 53, value: borsh.unit},
})


// FIXME: note, that Geyser encodes error in bincode format,
// thankfully the encoding for the current error structure matches borsh.
// ref: https://github.com/anza-xyz/agave/blob/164f6a14a72817810db8443ed4263a526bac1482/sdk/transaction-error/src/lib.rs#L15
const TransactionErrorCodec = borsh.sum(4, {
    AccountInUse: {discriminator: 0, value: borsh.unit},
    AccountLoadedTwice: {discriminator: 1, value: borsh.unit},
    AccountNotFound: {discriminator: 2, value: borsh.unit},
    ProgramAccountNotFound: {discriminator: 3, value: borsh.unit},
    InsufficientFundsForFee: {discriminator: 4, value: borsh.unit},
    InvalidAccountForFee: {discriminator: 5, value: borsh.unit},
    AlreadyProcessed: {discriminator: 6, value: borsh.unit},
    BlockhashNotFound: {discriminator: 7, value: borsh.unit},
    InstructionError: {discriminator: 8, value: borsh.tuple([borsh.u8, InstructionErrorCodec])},
    CallChainTooDeep: {discriminator: 9, value: borsh.unit},
    MissingSignatureForFee: {discriminator: 10, value: borsh.unit},
    InvalidAccountIndex: {discriminator: 11, value: borsh.unit},
    SignatureFailure: {discriminator: 12, value: borsh.unit},
    InvalidProgramForExecution: {discriminator: 13, value: borsh.unit},
    SanitizeFailure: {discriminator: 14, value: borsh.unit},
    ClusterMaintenance: {discriminator: 15, value: borsh.unit},
    AccountBorrowOutstanding: {discriminator: 16, value: borsh.unit},
    WouldExceedMaxBlockCostLimit: {discriminator: 17, value: borsh.unit},
    UnsupportedVersion: {discriminator: 18, value: borsh.unit},
    InvalidWritableAccount: {discriminator: 19, value: borsh.unit},
    WouldExceedMaxAccountCostLimit: {discriminator: 20, value: borsh.unit},
    WouldExceedAccountDataBlockLimit: {discriminator: 21, value: borsh.unit},
    TooManyAccountLocks: {discriminator: 22, value: borsh.unit},
    AddressLookupTableNotFound: {discriminator: 23, value: borsh.unit},
    InvalidAddressLookupTableOwner: {discriminator: 24, value: borsh.unit},
    InvalidAddressLookupTableData: {discriminator: 25, value: borsh.unit},
    InvalidAddressLookupTableIndex: {discriminator: 26, value: borsh.unit},
    InvalidRentPayingAccount: {discriminator: 27, value: borsh.unit},
    WouldExceedMaxVoteCostLimit: {discriminator: 28, value: borsh.unit},
    WouldExceedAccountDataTotalLimit: {discriminator: 29, value: borsh.unit},
    DuplicateInstruction: {discriminator: 30, value: borsh.u8},
    InsufficientFundsForRent: {
        discriminator: 31,
        value: borsh.struct({
            account_index: borsh.u8,
        }),
    },
    MaxLoadedAccountsDataSizeExceeded: {discriminator: 32, value: borsh.unit},
    InvalidLoadedAccountsDataSizeLimit: {discriminator: 33, value: borsh.unit},
    ResanitizationNeeded: {discriminator: 34, value: borsh.unit},
    ProgramExecutionTemporarilyRestricted: {
        discriminator: 35,
        value: borsh.struct({
            account_index: borsh.u8,
        }),
    },
    UnbalancedTransaction: {discriminator: 36, value: borsh.unit},
    ProgramCacheHitMaxLimit: {discriminator: 37, value: borsh.unit},
})


function normalizeEnum(value: {kind: string, value?: any}) {
    if (value.value == null) {
        return value.kind
    } else {
        return {[value.kind]: value.value}
    }
}
