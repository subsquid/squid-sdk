import {SolanaBatchProcessor} from '@subsquid/solana-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import * as tokenProgram from './abi/token-program'
import * as whirlpool from './abi/whirpool'
import {Exchange} from './model'


const processor = new SolanaBatchProcessor()
    .setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
    .setBlockRange({
        from: 200_000_000,
    })
    .addInstruction({
        programId: [whirlpool.programId],
        d8: [whirlpool.swap.d8],
        ...whirlpool.swap.accountSelection({
            whirlpool: ['7qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm']
        }),
        innerInstructions: true,
        transaction: true,
        transactionTokenBalances: true,
        isCommitted: true
    })


processor.run(new TypeormDatabase(), async ctx => {
    let exchanges: Exchange[] = []

    for (let block of ctx.blocks) {
        for (let i = 0; i < block.instructions.length; i++) {
            let ins = block.instructions[i]
            if (ins.programId === whirlpool.programId && ins.d8 === whirlpool.swap.d8) {
                let exchange = new Exchange({
                    id: ins.id,
                    slot: block.header.slot,
                    tx: ins.getTransaction().signatures[0],
                    timestamp: new Date(block.header.timestamp)
                })

                // assert(ins.inner.length == 2)
                if (ins.inner.length != 2) continue
                let srcTransfer = tokenProgram.transfer.decode(ins.inner[0])
                let destTransfer = tokenProgram.transfer.decode(ins.inner[1])

                let srcBalance = ins.getTransaction().tokenBalances.find(tb => tb.account == srcTransfer.accounts.source)
                let destBalance = ins.getTransaction().tokenBalances.find(tb => tb.account === destTransfer.accounts.source)

                if (srcBalance == null || destBalance == null) continue
                // assert(srcBalance)
                // assert(destBalance)

                exchange.fromToken = srcBalance.mint
                exchange.fromOwner = srcBalance.owner!
                exchange.fromAmount = srcTransfer.data.amount

                exchange.toToken = destBalance.mint
                exchange.toOwner = destBalance.owner!
                exchange.toAmount = destTransfer.data.amount

                exchanges.push(exchange)
            }
        }
    }

    await ctx.store.insert(exchanges)
})
