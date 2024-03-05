import {SolanaBatchProcessor} from '@subsquid/solana-processor/lib/processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'


const processor = new SolanaBatchProcessor()
    .setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
    .setBlockRange({
        from: 200_000_000,
        to: 200_014_000
    })
    .addInstruction({
        programId: ["whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc"],
        a2: ["7qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"],
        d8: ["0xf8c69e91e17587c8"],
        innerInstructions: true,
        transaction: true
    })


processor.run(new TypeormDatabase(), async ctx => {
    ctx.log.info({
        txs: ctx.blocks.map(b => b.transactions.length).reduce((s, len) => s + len, 0)
    })
})
