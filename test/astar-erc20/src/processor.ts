import {SubstrateBatchProcessor, assertNotNull} from '@subsquid/substrate-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './erc20'
import {Transaction} from './model'
import {toJSON} from '@subsquid/util-internal-json'
import {getTransaction, getTransactionResult} from '@subsquid/frontier'

const processor = new SubstrateBatchProcessor()
    .setDataSource({
        chain: 'wss://public-rpc.pinknode.io/astar',
        archive: 'https://astar.archive.subsquid.io/graphql',
    })
    .addEthereumTransaction([
        '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98',
        '0x3795C36e7D12A8c252A20C5a7B455f7c57b60283',
    ])

function decodeInput(input: string): {method: string; args: any[]} | undefined {
    let sighash = input.slice(0, 10)

    switch (sighash) {
        case erc20.functions['approve(address,uint256)'].sighash: {
            const decoded = erc20.functions['approve(address,uint256)'].decode(input)
            return {
                method: 'approve',
                args: [decoded[0], decoded[1].toBigInt()],
            }
        }
        case erc20.functions['transfer(address,uint256)'].sighash: {
            const decoded = erc20.functions['transfer(address,uint256)'].decode(input)
            return {
                method: 'transfer',
                args: [decoded[0], decoded[1].toBigInt()],
            }
        }
        case erc20.functions['transferFrom(address,address,uint256)'].sighash: {
            const decoded = erc20.functions['transferFrom(address,address,uint256)'].decode(input)
            return {
                method: 'transferFrom',
                args: [decoded[0], decoded[0], decoded[2].toBigInt()],
            }
        }
        default:
            return undefined
    }
}

processor.run(new TypeormDatabase(), async (ctx) => {
    let transactions = []
    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.kind == 'event' && item.name == 'Ethereum.Executed') {
                let result = getTransactionResult(ctx, item.event)
                if (result.status !== 'Succeed') {
                    ctx.log.warn(`Transaction failed. ${result.status}: ${result.reason}`)
                }

                let call = assertNotNull(item.event.call)
                let transaction = getTransaction(ctx, call)

                let input = decodeInput(transaction.input)
                if (!input) continue

                transactions.push(
                    new Transaction({
                        id: call.id,
                        block: block.header.height,
                        timestamp: new Date(block.header.timestamp),
                        txHash: transaction.hash,
                        from: transaction.from,
                        to: transaction.to,
                        type: transaction.type || 0,
                        input: toJSON(input),
                    })
                )
            }
        }
    }

    await ctx.store.save(transactions)
})
