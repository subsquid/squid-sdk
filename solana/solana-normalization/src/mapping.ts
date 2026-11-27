import type * as rpc from '@subsquid/solana-rpc-data'
import {addErrorContext, assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'
import {Balance, Block, BlockHeader, Instruction, LogMessage, Reward, TokenBalance, Transaction, TransactionConfig} from './data'
import {InstructionTreeTraversal, MessageStream, ParsingError} from './instruction-parser'
import {detectLogFormat, LogFormat, LogTruncatedMessage} from './log-parser'
import {Journal, TransactionContext} from './transaction-context'


export {Journal, LogFormat}


export interface MapRpcBlockOptions {
    /**
     * Log format to assume, when the block itself does not show it
     * (no transaction has a structural log message, e.g. a block of vote transactions only).
     *
     * The format belongs to the node that recorded the block, so a caller mapping consecutive blocks
     * can pass the format of the last block that showed one ({@link getBlockLogFormat}).
     * A block that shows its own format always uses it.
     */
    logFormat?: LogFormat
}


/**
 * Log format shown by the transactions of a block: `v1.3` when some transaction has v1.3 structural messages
 * and none has modern ones, `modern` when some has modern ones, `undefined` when there are none.
 *
 * Call it before removing vote transactions: in the modern format they log their calls too.
 */
export function getBlockLogFormat(src: rpc.GetBlock): LogFormat | undefined {
    let v13 = false
    for (let tx of src.transactions ?? []) {
        let format = detectLogFormat(tx.meta.logMessages ?? [])
        if (format === 'modern') return 'modern'
        if (format === 'v1.3') v13 = true
    }
    return v13 ? 'v1.3' : undefined
}


export function mapRpcBlock(slot: number, src: rpc.GetBlock, journal: Journal, options?: MapRpcBlockOptions): Block {
    let header: BlockHeader = {
        hash: src.blockhash,
        height: assertNotNull(src.blockHeight, '.blockHeight is not available'),
        number: slot,
        parentNumber: src.parentSlot,
        parentHash: src.previousBlockhash,
        timestamp: src.blockTime ?? 0
    }

    let items = new ItemMapping(journal, src, options?.logFormat)

    let rewards = src.rewards?.map(s => {
        let reward: Reward = {
            pubkey: s.pubkey,
            lamports: BigInt(s.lamports),
            postBalance: BigInt(s.postBalance)
        }

        if (s.rewardType) {
            reward.rewardType = s.rewardType
        }

        if (s.commission != null) {
            reward.commission = s.commission
        }

        return reward
    })

    return {
        header,
        transactions: items.transactions,
        instructions: items.instructions,
        logs: items.logs,
        balances: items.balances,
        tokenBalances: items.tokenBalances,
        rewards: rewards || []
    }
}


class ItemMapping {
    transactions: Transaction[] = []
    instructions: Instruction[] = []
    logs: LogMessage[] = []
    balances: Balance[] = []
    tokenBalances: TokenBalance[] = []

    constructor(
        private journal: Journal,
        block: rpc.GetBlock,
        logFormatHint?: LogFormat
    ) {
        let transactions = block.transactions ?? []

        let messageStreams = transactions.map(tx => new MessageStream(tx.meta.logMessages ?? []))

        // Log format is a property of the node, that recorded the block.
        // Hence, a transaction without any structural log messages (e.g. one calling only native programs)
        // inherits the v1.3 format, when the block has it, or when the caller says so for a block,
        // that does not show any format.
        let blockFormat: LogFormat | undefined
        if (messageStreams.some(s => s.format === 'modern')) {
            blockFormat = 'modern'
        } else if (messageStreams.some(s => s.format === 'v1.3')) {
            blockFormat = 'v1.3'
        } else {
            blockFormat = logFormatHint
        }
        if (blockFormat === 'v1.3') {
            // A program, that logs its calls somewhere in the block, is a BPF program:
            // a call of it without log messages is a missing log.
            let loggingPrograms = new Set(messageStreams.flatMap(s => s.calledPrograms()))
            for (let i = 0; i < transactions.length; i++) {
                let stream = messageStreams[i]
                if (stream.format === 'unknown' && transactions[i].meta.logMessages != null) {
                    stream.nativeProgramsAreSilent = true
                }
                if (stream.nativeProgramsAreSilent) {
                    stream.loggingPrograms = loggingPrograms
                }
            }
        }

        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            let txIndex = tx._index ?? i
            try {
                this.processTransaction(txIndex, tx, messageStreams[i])
            } catch(err: any) {
                throw addErrorContext(err, {
                    transactionHash: tx.transaction.signatures[0]
                })
            }
        }
    }

    private processTransaction(transactionIndex: number, src: rpc.Transaction, messages: MessageStream): void {
        let mapped = mapTransaction(transactionIndex, src)

        let ctx = new TransactionContext(transactionIndex, src, this.journal)

        let insCheckPoint = this.instructions.length
        let logCheckPoint = this.logs.length
        try {
            this.traverseInstructions(ctx, messages)
            mapped.hasDroppedLogMessages = messages.truncated
            if (!messages.ended) {
                let err = new ParsingError('not all log messages where consumed')
                err.logMessageIndex = messages.position
                throw err
            }
        } catch(err: any) {
            if (err instanceof ParsingError) {
                // report parsing problem
                let {msg, ...props} = err
                ctx.error(props, msg)
                // reparse without log messages
                mapped.hasDroppedLogMessages = true
                // restore state before failed traversal
                this.instructions = this.instructions.slice(0, insCheckPoint)
                this.logs = this.logs.slice(0, logCheckPoint)
                // traverse again with dummy truncated MessageStream
                this.traverseInstructions(
                    ctx,
                    new MessageStream([new LogTruncatedMessage().toString()])
                )
            } else {
                throw err
            }
        }

        this.transactions.push(mapped)
        this.balances.push(...mapBalances(ctx))
        this.tokenBalances.push(...mapTokenBalances(ctx))
    }

    private traverseInstructions(ctx: TransactionContext, messages: MessageStream): void {
        for (let i = 0; i < ctx.tx.transaction.message.instructions.length; i++) {
            let ins = ctx.tx.transaction.message.instructions[i]

            let inner = ctx.tx.meta.innerInstructions?.flatMap(pack => {
                return pack.index === i ? pack.instructions : []
            })

            new InstructionTreeTraversal(
                ctx,
                messages,
                i,
                ins,
                inner ?? [],
                this.instructions,
                this.logs
            )
        }
    }
}


function mapTransaction(transactionIndex: number, src: rpc.Transaction): Transaction {
    let tx: Transaction = {
        transactionIndex,
        version: src.version,
        accountKeys: src.transaction.message.accountKeys,
        addressTableLookups: src.transaction.message.addressTableLookups ?? [],
        numReadonlySignedAccounts: src.transaction.message.header.numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts: src.transaction.message.header.numReadonlyUnsignedAccounts,
        numRequiredSignatures: src.transaction.message.header.numRequiredSignatures,
        recentBlockhash: src.transaction.message.recentBlockhash,
        signatures: src.transaction.signatures,
        err: src.meta.err,
        computeUnitsConsumed: BigInt(src.meta.computeUnitsConsumed ?? 0),
        costUnits: BigInt(src.meta.costUnits ?? 0),
        fee: BigInt(src.meta.fee),
        loadedAddresses: src.meta.loadedAddresses ?? {readonly: [], writable: []},
        hasDroppedLogMessages: false
    }

    let config = src.transaction.message.transactionConfig
    if (config) {
        tx.transactionConfig = {
            computeUnitLimit: config.computeUnitLimit,
            heapSize: config.heapSize,
            loadedAccountsDataSizeLimit: config.loadedAccountsDataSizeLimit,
            priorityFee: config.priorityFee == null ? null : BigInt(config.priorityFee)
        }
    }

    return tx
}


function mapBalances(ctx: TransactionContext): Balance[] {
    let balances: Balance[] = []

    let pre = ctx.tx.meta.preBalances
    let post = ctx.tx.meta.postBalances

    assert(pre.length == post.length)

    for (let i = 0; i < pre.length; i++) {
        if (pre[i] === post[i]) {
            // nothing changed, don't create an entry
        } else {
            balances.push({
                transactionIndex: ctx.transactionIndex,
                account: ctx.getAccount(i),
                pre: BigInt(pre[i]),
                post: BigInt(post[i])
            })
        }
    }

    balances.sort((a, b) => {
        if (a.account < b.account) return -1
        if (a.account > b.account) return 1
        return 0
    })

    return balances
}


function mapTokenBalances(ctx: TransactionContext): TokenBalance[] {
    let balances: TokenBalance[] = []

    let preBalances = new Map(
        ctx.tx.meta.preTokenBalances?.map(b => [ctx.getAccount(b.accountIndex), b])
    )

    let postBalances = new Map(
        ctx.tx.meta.postTokenBalances?.map(b => [ctx.getAccount(b.accountIndex), b])
    )

    for (let [account, post] of postBalances.entries()) {
        let pre = preBalances.get(account)
        if (pre) {
            balances.push({
                transactionIndex: ctx.transactionIndex,
                account,

                preProgramId: pre.programId ?? undefined,
                preMint: pre.mint,
                preDecimals: pre.uiTokenAmount.decimals,
                preOwner: pre.owner ?? undefined,
                preAmount: BigInt(pre.uiTokenAmount.amount),

                postProgramId: post.programId ?? undefined,
                postMint: post.mint,
                postDecimals: post.uiTokenAmount.decimals,
                postOwner: post.owner ?? undefined,
                postAmount: BigInt(post.uiTokenAmount.amount)
            })
        } else {
            balances.push({
                transactionIndex: ctx.transactionIndex,
                account,
                postProgramId: post.programId ?? undefined,
                postMint: post.mint,
                postDecimals: post.uiTokenAmount.decimals,
                postOwner: post.owner ?? undefined,
                postAmount: BigInt(post.uiTokenAmount.amount)
            })
        }
    }

    for (let [account, pre] of preBalances.entries()) {
        if (postBalances.has(account)) continue
        balances.push({
            transactionIndex: ctx.transactionIndex,
            account,
            preProgramId: pre.programId ?? undefined,
            preMint: pre.mint,
            preDecimals: pre.uiTokenAmount.decimals,
            preOwner: pre.owner ?? undefined,
            preAmount: BigInt(pre.uiTokenAmount.amount)
        })
    }

    balances.sort((a, b) => {
        if (a.account < b.account) return -1
        if (a.account > b.account) return 1
        return 0
    })

    return balances
}