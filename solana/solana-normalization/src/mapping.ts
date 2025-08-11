import type * as rpc from '@subsquid/solana-rpc-data'
import {addErrorContext, assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'
import {Balance, Block, BlockHeader, Instruction, LogMessage, Reward, TokenBalance, Transaction} from './data'
import {InstructionTreeTraversal, MessageStream, ParsingError} from './instruction-parser'
import {LogTruncatedMessage} from './log-parser'
import {Journal, TransactionContext} from './transaction-context'


export {Journal}


export function mapRpcBlock(slot: number, src: rpc.GetBlock, journal: Journal): Block {
    let header: BlockHeader = {
        hash: src.blockhash,
        height: src.blockHeight ?? undefined,
        slot,
        parentSlot: src.parentSlot,
        parentHash: src.previousBlockhash,
        timestamp: src.blockTime ?? 0
    }

    let items = new ItemMapping(journal, src)

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
        block: rpc.GetBlock
    ) {
        let transactions = block.transactions ?? []
        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            let txIndex = tx._index ?? i
            try {
                this.processTransaction(txIndex, tx)
            } catch(err: any) {
                throw addErrorContext(err, {
                    transactionHash: tx.transaction.signatures[0]
                })
            }
        }
    }

    private processTransaction(transactionIndex: number, src: rpc.Transaction): void {
        let mapped = mapTransaction(transactionIndex, src)

        let ctx = new TransactionContext(transactionIndex, src, this.journal)

        let messages = new MessageStream(src.meta.logMessages ?? [])

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
    return {
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
        fee: BigInt(src.meta.fee),
        loadedAddresses: src.meta.loadedAddresses ?? {readonly: [], writable: []},
        hasDroppedLogMessages: false
    }
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
