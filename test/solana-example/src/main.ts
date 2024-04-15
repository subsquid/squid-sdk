import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/solana-objects'
import {DataSourceBuilder, SolanaRpcClient} from '@subsquid/solana-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import * as tokenProgram from './abi/token-program'
import * as whirlpool from './abi/whirpool'
import {Exchange} from './model'


const dataSource = new DataSourceBuilder()
    .setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
    .setRpc(process.env.SOLANA_NODE == null ? undefined : {
        client: new SolanaRpcClient({
            url: process.env.SOLANA_NODE,
        }),
        strideConcurrency: 10
    })
    .setBlockRange({from: 220_000_000})
    .addInstruction({
        where: {
            programId: [whirlpool.programId],
            d8: [whirlpool.swap.d8],
            isCommitted: true
        },
        include: {
            innerInstructions: true,
            transaction: true,
            transactionTokenBalances: true,
        }
    }).build()


run(dataSource, new TypeormDatabase(), async ctx => {
    let blocks = ctx.blocks.map(augmentBlock)

    let exchanges: Exchange[] = []

    for (let block of blocks) {
        for (let ins of block.instructions) {
            if (ins.programId === whirlpool.programId && ins.d8 === whirlpool.swap.d8) {
                let exchange = new Exchange({
                    id: ins.id,
                    slot: block.header.slot,
                    tx: ins.getTransaction().signatures[0],
                    timestamp: new Date(block.header.timestamp)
                })

                assert(ins.inner.length == 2)
                let srcTransfer = tokenProgram.transfer.decode(ins.inner[0])
                let destTransfer = tokenProgram.transfer.decode(ins.inner[1])

                let srcBalance = ins.getTransaction().tokenBalances.find(tb => tb.account == srcTransfer.accounts.source)
                let destBalance = ins.getTransaction().tokenBalances.find(tb => tb.account === destTransfer.accounts.destination)

                let srcMint = srcBalance?.mint || ins.getTransaction().tokenBalances.find(tb => tb.account === srcTransfer.accounts.destination)?.mint
                let destMint = destBalance?.mint || ins.getTransaction().tokenBalances.find(tb => tb.account === destTransfer.accounts.source)?.mint

                assert(srcMint)
                assert(destMint)

                exchange.fromToken = srcMint
                exchange.fromOwner = srcBalance?.preOwner || srcBalance?.postOwner || srcTransfer.accounts.source
                exchange.fromAmount = srcTransfer.data.amount

                exchange.toToken = destMint
                exchange.toOwner = destBalance?.postOwner || destBalance?.preOwner || destTransfer.accounts.destination
                exchange.toAmount = destTransfer.data.amount

                exchanges.push(exchange)
            }
        }
    }

    await ctx.store.insert(exchanges)
})
